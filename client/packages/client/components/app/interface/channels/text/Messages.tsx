import {
  Accessor,
  For,
  JSX,
  Show,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
} from "solid-js";

import { Channel, Message as MessageInterface } from "stoat.js";

import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { useTime } from "@revolt/i18n";
import { useState } from "@revolt/state";
import { ConversationStart, Deferred, JumpToBottom } from "@revolt/ui";

import {
  ListView2,
} from "@revolt/ui/components/utils/ListView2";
import { useMessageCache } from "./MessageCache";
import { Entry, AnchorToEnd, Padding, type ListEntry } from "./MessagesEntry";
import { useMessageFetching } from "./useMessageFetching";
import { buildMessageEntries } from "./buildMessageEntries";

interface Props {
  /** Channel to fetch messages from */
  channel: Channel;
  /** Pending messages to render at the end of the list */
  pendingMessages?: (props: { tail: boolean; ids: string[] }) => JSX.Element;
  /** Display typing indicator instead of padding */
  typingIndicator?: JSX.Element;
  /** Highlighted message id */
  highlightedMessageId: Accessor<string | undefined>;
  /** Last read message id */
  lastReadId: Accessor<string | undefined>;
  /** Clear the highlighted message */
  clearHighlightedMessage: () => void;
  /** Bind the jump-to-bottom function to the parent */
  jumpToBottomRef?: (fn: (nearby?: string) => void) => void;
  /** Bind the atEnd signal to the parent */
  atEndRef?: (fn: () => boolean) => void;
}

/**
 * Render messages in a Channel
 */
export function Messages(props: Props) {
  const cache = useMessageCache();
  const lifecycle = useClientLifecycle();
  const client = useClient();
  const state = useState();
  const dayjs = useTime();

  // All fetch logic is in the hook
  const fetch = useMessageFetching();

  let listRef: HTMLDivElement | undefined;

  // Object cache for preventing re-renders
  const objectCache = new Map();

  // Build enriched message entries (tail, blocked, dividers)
  const messagesWithTail = createMemo<ListEntry[]>(() =>
    buildMessageEntries(
      fetch.messages(),
      props.lastReadId() ?? "0",
      objectCache,
      (date) => dayjs(date).format("LL"),
    ),
  );

  // --- Effects ---

  onMount(() => {
    props.jumpToBottomRef?.(jumpToBottom);
    props.atEndRef?.(fetch.atEnd);
  });

  // Fetch messages on channel mount
  createEffect(
    on(
      () => props.channel,
      (channel) => {
        fetch.caseInitialLoad(
          channel,
          cache!,
          listRef,
          props.highlightedMessageId(),
        );

        onCleanup(() => {
          if (fetch.fetching() !== "initial") {
            cache!.manage(channel, {
              messages: fetch.messages(),
              atStart: fetch.atStart(),
              atEnd: fetch.atEnd(),
              scrollTop: listRef?.scrollTop,
            });
          }
        });
      },
    ),
  );

  // Jump to highlighted message
  createEffect(
    on(
      () => props.highlightedMessageId(),
      (messageId) => {
        if (messageId && fetch.messages()) {
          const findIndex = (id: string) =>
            messagesWithTail().findIndex(
              (entry) => entry.t === 0 && entry.message.id === id,
            );
          fetch.caseJumpToMessage(
            props.channel,
            messageId,
            listRef,
            findIndex,
          );
        }
      },
    ),
  );

  // Message event listeners
  onMount(() => {
    const c = client();
    const onMsg = (message: MessageInterface) =>
      fetch.onNewMessage(message, props.channel.id);
    const onDel = (message: { id: string; channelId: string }) => {
      if (message.channelId === props.channel.id) {
        fetch.onDeleteMessage(message.id, message.channelId);
      }
    };

    c.addListener("messageCreate", onMsg);
    c.addListener("messageDelete", onDel);

    onCleanup(() => {
      c.removeListener("messageCreate", onMsg);
      c.removeListener("messageDelete", onDel);
    });
  });

  // Reload on reconnect
  createEffect(
    on(
      () => lifecycle.lifecycle.state(),
      (s) => {
        if (
          s === State.Connected &&
          fetch.atEnd() &&
          !props.highlightedMessageId
        ) {
          fetch.caseInitialLoad(props.channel, cache!, listRef);
        }
      },
      { defer: true },
    ),
  );

  // Edit last own message
  createEffect(
    on(
      () => state.draft.editingMessageId,
      (shouldSetEditingMessageId) =>
        shouldSetEditingMessageId === true &&
        state.draft.setEditingMessage(
          fetch.messages().find((message) => message.author?.self),
        ),
    ),
  );

  // --- Helpers ---

  function jumpToBottom() {
    fetch.caseJumpToBottom(props.channel, listRef);
    if (props.highlightedMessageId()) {
      props.clearHighlightedMessage();
    }
  }

  function pendingMessageIsTrailing() {
    const msgs = messagesWithTail();
    const last = msgs[msgs.length - 1];
    return last &&
      last.t === 0 &&
      last.message.author?.self &&
      Math.abs(+new Date() - +last.message.createdAt) < 420000;
  }

  function sentMessageIdempotency() {
    return fetch.messages().map((msg) => msg.nonce!);
  }

  // --- Render ---

  return (
    <>
      <ListView2
        fetchTop={() => fetch.caseFetchUpwards(props.channel)}
        fetchBottom={() => fetch.caseFetchDownwards(props.channel)}
        atStart={fetch.atStart}
        atEnd={fetch.atEnd}
        permitFetching={() => typeof fetch.fetching() !== "string"}
      >
        <Deferred>
          <div>
            <div ref={listRef}>
              <Show when={fetch.atStart()}>
                <ConversationStart channel={props.channel} />
              </Show>
              <For each={messagesWithTail()}>
                {(entry) => (
                  <Entry
                    {...entry}
                    highlightedMessageId={props.highlightedMessageId}
                    editingMessageId={
                      typeof state.draft.editingMessageId === "string"
                        ? state.draft.editingMessageId
                        : undefined
                    }
                  />
                )}
              </For>
              <Show when={fetch.atEnd()}>
                {props.pendingMessages?.({
                  tail: pendingMessageIsTrailing(),
                  ids: sentMessageIdempotency(),
                })}
                {props.typingIndicator ?? <Padding />}
              </Show>
            </div>
          </div>
        </Deferred>
      </ListView2>
      <Show when={!fetch.atEnd()}>
        <AnchorToEnd>
          <JumpToBottom onClick={jumpToBottom} />
        </AnchorToEnd>
      </Show>
    </>
  );
}
