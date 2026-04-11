import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { CONFIGURATION, debounce } from "@revolt/common";
import { Keybind, KeybindAction, createKeybind } from "@revolt/keybinds";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import {
  CompositionMediaPicker,
  FileCarousel,
  FileDropAnywhereCollector,
  FilePasteCollector,
  IconButton,
  MessageBox,
  MessageReplyPreview,
  humanFileSize,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { useSearchSpace } from "@revolt/ui/components/utils/autoComplete";

import { ScheduleMessageButton } from "./ScheduledMessages";
import { VoiceRecorder } from "./VoiceRecorder";

interface Props {
  /**
   * Channel to compose for
   */
  channel: Channel;

  /**
   * Notify parent component when a message is sent
   */
  onMessageSend?: () => void;
}

/**
 * Message composition engine
 */
export function MessageComposition(props: Props) {
  const state = useState();
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  createKeybind(KeybindAction.CHAT_JUMP_END, () =>
    setNodeReplacement(["_focus"]),
  );

  createKeybind(KeybindAction.CHAT_FOCUS_COMPOSITION, () =>
    setNodeReplacement(["_focus"]),
  );

  /**
   * Get the draft for the current channel
   * @returns Draft
   */
  function draft() {
    return state.draft.getDraft(props.channel.id);
  }

  // Whether the send button should be active/clickable
  const canSend = createMemo(() => {
    const draftContent = draft()?.content ?? "";
    const draftFiles = draft()?.files ?? [];

    return draftContent.trim().length > 0 || draftFiles.length > 0;
  });

  // TEMP
  function currentValue() {
    return draft()?.content ?? "";
  }

  const [initialValue, setInitialValue] = createSignal([
    currentValue(),
  ] as const);

  const [nodeReplacement, setNodeReplacement] =
    createSignal<readonly [string | "_focus"]>();

  // bind this composition instance to the global node replacement signal
  state.draft._setNodeReplacement = setNodeReplacement;
  onCleanup(() => (state.draft._setNodeReplacement = undefined));

  createEffect(
    on(
      () => props.channel,
      () => setInitialValue([currentValue()]),
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => currentValue(),
      (value) => {
        if (value === "") {
          setInitialValue([""]);
        }
      },
      { defer: true },
    ),
  );
  // END TEMP

  /**
   * Keep track of last time we sent a typing packet
   */
  let isTyping: number | undefined = undefined;

  /**
   * Send typing packet
   */
  function startTyping() {
    if (typeof isTyping === "number" && +new Date() < isTyping) return;

    const ws = client()!.events;
    if (ws.state() === 2) {
      isTyping = +new Date() + 2500;
      ws.send({
        type: "BeginTyping",
        channel: props.channel.id,
      });
    }
  }

  /**
   * Send stop typing packet
   */
  function stopTyping() {
    if (isTyping) {
      const ws = client()!.events;
      if (ws.state() === 2) {
        isTyping = undefined;
        ws.send({
          type: "EndTyping",
          channel: props.channel.id,
        });
      }
    }
  }

  /**
   * Stop typing after some time
   */
  const delayedStopTyping = debounce(stopTyping, 1000); // eslint-disable-line solid/reactivity

  /**
   * Send a message using the current draft
   * @param useContent Content to send
   */
  async function sendMessage(useContent?: unknown) {
    stopTyping();
    props.onMessageSend?.();

    if (typeof useContent === "string") {
      const currentDraft = draft();
      if (
        currentDraft?.replies?.length &&
        !currentDraft.content &&
        !currentDraft.files?.length
      ) {
        state.draft.setDraft(props.channel.id, {
          ...currentDraft,
          content: useContent,
        });
        return state.draft.sendDraft(client(), props.channel);
      }
      return props.channel.sendMessage(useContent);
    }

    state.draft.sendDraft(client(), props.channel);
  }

  /**
   * Send message silently (without notifications)
   */
  async function sendSilent() {
    const currentDraft = draft();
    const content = currentDraft?.content?.trim();
    if (!content && !currentDraft?.files?.length) return;

    // Prepend @silent prefix — Channel.sendMessage strips it and sets SuppressNotifications flag
    const silentContent = `@silent ${content ?? ""}`.trim();
    if (currentDraft?.replies?.length || currentDraft?.files?.length) {
      state.draft.setDraft(props.channel.id, {
        ...currentDraft,
        content: silentContent,
      });
      return state.draft.sendDraft(client(), props.channel);
    }
    stopTyping();
    props.onMessageSend?.();
    return props.channel.sendMessage(silentContent);
  }

  /**
   * Shorthand for updating the draft
   */
  function setContent(content: string) {
    state.draft.setDraft(props.channel.id, { content });
    startTyping();
  }

  /**
   * Handle files being added to the draft.
   * @param files List of files
   */
  function onFiles(files: File[]) {
    const rejectedFiles: File[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > CONFIGURATION.MAX_FILE_SIZE) {
        rejectedFiles.push(file);
      } else {
        validFiles.push(file);
      }
    }

    if (rejectedFiles.length > 0) {
      const maxSizeFormatted = humanFileSize(CONFIGURATION.MAX_FILE_SIZE);

      if (rejectedFiles.length === 1) {
        const file = rejectedFiles[0];
        const fileSize = humanFileSize(file.size);
        const error = new Error(
          t`The file "${file.name}" (${fileSize}) exceeds the maximum size limit of ${maxSizeFormatted}.`,
        );
        error.name = t`File too large`;
        openModal({
          type: "error2",
          error,
        });
      } else {
        const error = new Error(
          t`${rejectedFiles.length} files exceed the maximum size limit of ${maxSizeFormatted} and were not uploaded.`,
        );
        error.name = t`Files too large`;
        openModal({
          type: "error2",
          error,
        });
      }
    }

    for (const file of validFiles) {
      state.draft.addFile(props.channel.id, file);
    }
  }

  /**
   * Add a file to the message
   */
  function addFile() {
    const input = document.createElement("input");
    input.accept = "*";
    input.type = "file";
    input.multiple = true;
    input.style.display = "none";

    input.addEventListener("change", async (e) => {
      // Get all attached files
      const files = (e.currentTarget as HTMLInputElement)?.files;

      // Remove element from DOM
      input.remove();

      // Skip execution if no files specified
      if (!files) return;
      onFiles([...files]);
    });

    // iOS requires us to append the file input
    // to DOM to allow us to add any images
    document.body.appendChild(input);
    input.click();
  }

  /**
   * Remove a file by its ID
   * @param fileId File ID
   */
  function removeFile(fileId: string) {
    state.draft.removeFile(props.channel.id, fileId);
  }

  const searchSpace = useSearchSpace(() => props.channel, client);

  return (
    <>
      <Show when={state.draft.hasAdditionalElements(props.channel.id)}>
        <Keybind
          keybind={KeybindAction.CHAT_REMOVE_COMPOSITION_ELEMENT}
          onPressed={() => state.draft.popFromDraft(props.channel.id)}
        />
      </Show>
      <FileCarousel
        files={draft().files ?? []}
        getFile={state.draft.getFile}
        addFile={addFile}
        removeFile={removeFile}
      />
      <For each={draft().replies ?? []}>
        {(reply) => {
          const message = client()!.messages.get(reply.id);

          /**
           * Toggle mention on reply
           */
          function toggle() {
            state.draft.toggleReplyMention(props.channel.id, reply.id);
          }

          /**
           * Dismiss a reply
           */
          function dismiss() {
            state.draft.removeReply(props.channel.id, reply.id);
          }

          return (
            <MessageReplyPreview
              message={message}
              mention={reply.mention}
              toggle={toggle}
              dismiss={dismiss}
              self={message?.authorId === client()!.user!.id}
            />
          );
        }}
      </For>
      <MessageBox
        initialValue={initialValue()}
        nodeReplacement={nodeReplacement()}
        onSendMessage={() => sendMessage()}
        onTyping={delayedStopTyping}
        onEditLastMessage={() => state.draft.setEditingMessage(true)}
        content={draft()?.content ?? ""}
        setContent={setContent}
        actionsStart={
          <Switch fallback={<MessageBox.InlineIcon size="short" />}>
            <Match when={props.channel.havePermission("UploadFiles")}>
              <MessageBox.InlineIcon size="wide">
                <IconButton onPress={addFile}>
                  <Symbol>add</Symbol>
                </IconButton>
              </MessageBox.InlineIcon>
              <MessageBox.InlineIcon size="normal">
                <IconButton
                  onPress={() => {
                    openModal({
                      type: "create_poll",
                      onSubmit: (question: string, options: string[], multi: boolean) => {
                        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
                        const lines = [
                          `📊 **${question}**`,
                          multi ? `*(${t`multiple choice`})*` : "",
                          "",
                          ...options.map((opt, i) => `${emojis[i] ?? `${i + 1}.`} ${opt}`),
                        ].filter(Boolean);
                        sendMessage(lines.join("\n"));
                      },
                    } as any);
                  }}
                  use:floating={{
                    tooltip: { placement: "top", content: t`Create poll` },
                  }}
                >
                  <Symbol>ballot</Symbol>
                </IconButton>
              </MessageBox.InlineIcon>
            </Match>
          </Switch>
        }
        actionsEnd={
          <CompositionMediaPicker
            onMessage={sendMessage}
            onTextReplacement={(text) => setNodeReplacement([text])}
          >
            {(triggerProps) => (
              <>
                <MessageBox.InlineIcon size="normal">
                  <IconButton onPress={triggerProps.onClickGif}>
                    <Symbol>gif_box</Symbol>
                  </IconButton>
                </MessageBox.InlineIcon>
                <MessageBox.InlineIcon size="normal">
                  <IconButton onPress={triggerProps.onClickEmoji}>
                    <Symbol>emoticon</Symbol>
                  </IconButton>
                </MessageBox.InlineIcon>
                <Show when={props.channel.havePermission("UploadFiles")}>
                  <MessageBox.InlineIcon size="normal">
                    <VoiceRecorder onRecorded={(file) => onFiles([file])} />
                  </MessageBox.InlineIcon>
                </Show>

                <div ref={triggerProps.ref} />
              </>
            )}
          </CompositionMediaPicker>
        }
        placeholder={
          props.channel.type === "SavedMessages"
            ? t`Save to your notes`
            : props.channel.type === "DirectMessage"
              ? t`Message ${props.channel.recipient?.username}`
              : t`Message ${props.channel.name}`
        }
        sendingAllowed={props.channel.havePermission("SendMessage")}
        autoCompleteSearchSpace={searchSpace}
        updateDraftSelection={(start, end) =>
          state.draft.setSelection(props.channel.id, start, end)
        }
        hasActionsAppend={
          state.settings.getValue("appearance:show_send_button") || false
        }
        actionsAppend={
          <Show when={state.settings.getValue("appearance:show_send_button")}>
            <IconButton
              _compositionSendMessage
              size="sm"
              variant={canSend() ? "filled" : "tonal"}
              shape="square"
              isDisabled={!canSend()}
              onPress={sendMessage}
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Send message`,
                },
              }}
            >
              <Symbol fill={true}>send</Symbol>
            </IconButton>
            <IconButton
              size="sm"
              variant="tonal"
              shape="square"
              isDisabled={!canSend()}
              onPress={() => sendSilent()}
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Send without notification`,
                },
              }}
            >
              <Symbol size={18}>notifications_off</Symbol>
            </IconButton>
            <ScheduleMessageButton
              channelId={props.channel.id}
              canSend={canSend()}
              getContent={() => draft()?.content}
              onScheduled={() => {
                state.draft.setDraft(props.channel.id, { content: "" });
                setInitialValue([""]);
              }}
            />
          </Show>
        }
      />
      <FilePasteCollector onFiles={onFiles} />
      <FileDropAnywhereCollector onFiles={onFiles} />
    </>
  );
}
