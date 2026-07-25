import {
  ErrorBoundary,
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { css, cva } from "styled-system/css";
import { API, Channel, Client } from "stoat.js";
import { styled } from "styled-system/jsx";
import { decodeTime, ulid } from "ulid";

import { DraftMessages, Messages } from "@revolt/app";
import { useClient } from "@revolt/client";
import { Keybind, KeybindAction, createKeybind } from "@revolt/keybinds";
import { useNavigate, useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import {
  BelowFloatingHeader,
  ErrorFallback,
  Header,
  NewMessages,
  Text,
  TypingIndicator,
  main,
} from "@revolt/ui";
import { useVoice, InRoom } from "@revolt/rtc";
import { VoiceCallCardActiveRoom } from "@revolt/ui/components/features/voice/callCard/VoiceCallCardActiveRoom";
import { VoiceCallCardPreview } from "@revolt/ui/components/features/voice/callCard/VoiceCallCardPreview";

import { ChannelHeader } from "../ChannelHeader";
import { ChannelPageProps } from "../ChannelPage";

import { MessageComposition } from "./Composition";
import { MemberSidebar } from "./MemberSidebar";
import { TextSearchSidebar } from "./TextSearchSidebar";

/**
 * State of the channel sidebar
 */
export type SidebarState =
  | {
      state: "search";
      query: string;
    }
  | {
      state: "pins";
    }
  | {
      state: "default";
    };

/**
 * Parse search query string to extract from:, has:, pinned:, before:, after: filters
 */
function parseSearchQuery(
  raw: string,
  client: Client,
): Omit<API.DataMessageSearch, "include_users"> {
  const result: Omit<API.DataMessageSearch, "include_users"> = {};

  // Extract from:username
  const fromMatch = raw.match(/from:(\S+)/i);
  if (fromMatch) {
    const username = fromMatch[1];
    const users = [...client.users.values()];
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
    if (user) {
      result.author = user.id;
    }
    raw = raw.replace(fromMatch[0], "").trim();
  }

  // Extract has:type
  const hasMatch = raw.match(/has:(\S+)/i);
  if (hasMatch) {
    const hasValue = hasMatch[1].toLowerCase();
    const hasMap: Record<string, string> = {
      attachment: "Attachment", file: "Attachment", файл: "Attachment",
      embed: "Embed", превью: "Embed",
      link: "Link", ссылка: "Link", ссылку: "Link",
      mention: "Mention", упоминание: "Mention",
    };
    if (hasMap[hasValue]) {
      result.has = hasMap[hasValue] as API.DataMessageSearch["has"];
    }
    raw = raw.replace(hasMatch[0], "").trim();
  }

  // Extract pinned: filter
  const pinnedMatch = raw.match(/pinned:(true|yes|да)/i);
  if (pinnedMatch) {
    result.pinned = true;
    raw = raw.replace(pinnedMatch[0], "").trim();
  }

  // Extract before:date (YYYY-MM-DD)
  const beforeMatch = raw.match(/before:(\d{4}-\d{2}-\d{2})/i);
  if (beforeMatch) {
    const ts = new Date(beforeMatch[1]).getTime();
    if (!isNaN(ts)) {
      // Convert date to ULID-compatible ID (timestamp prefix)
      const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
      let id = "";
      let t = ts;
      for (let i = 9; i >= 0; i--) {
        id = ENCODING[t % 32] + id;
        t = Math.floor(t / 32);
      }
      result.before = id + "0".repeat(16);
    }
    raw = raw.replace(beforeMatch[0], "").trim();
  }

  // Extract after:date (YYYY-MM-DD)
  const afterMatch = raw.match(/after:(\d{4}-\d{2}-\d{2})/i);
  if (afterMatch) {
    const ts = new Date(afterMatch[1]).getTime();
    if (!isNaN(ts)) {
      const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
      let id = "";
      let t = ts;
      for (let i = 9; i >= 0; i--) {
        id = ENCODING[t % 32] + id;
        t = Math.floor(t / 32);
      }
      result.after = id + "0".repeat(16);
    }
    raw = raw.replace(afterMatch[0], "").trim();
  }

  // Remaining text is the search query
  if (raw.length > 0) {
    result.query = raw;
  }

  return result;
}

/**
 * Channel component
 */
export function TextChannel(props: ChannelPageProps) {
  const state = useState();
  const client = useClient();
  const { t } = useLingui();

  // Last unread message id
  const [lastId, setLastId] = createSignal<string>();

  // Read highlighted message id from parameters
  const params = useSmartParams();
  const navigate = useNavigate();

  /**
   * Message id to be highlighted
   * @returns Message Id
   */
  const highlightMessageId = () => params().messageId;

  // Get a reference to the message box's load latest function
  let jumpToBottomRef: ((nearby?: string) => void) | undefined;

  // Get a reference to the message list's "end status"
  let atEndRef: (() => boolean) | undefined;

  // Store last unread message id
  createEffect(
    on(
      () => props.channel.id,
      (id) =>
        setLastId(
          props.channel.unread
            ? (client().channelUnreads.get(id)?.lastMessageId as string)
            : undefined,
        ),
    ),
  );

  // Mark channel as read whenever it is marked as unread
  createEffect(
    on(
      // must be at the end of the conversation
      () => props.channel.unread && (atEndRef ? atEndRef() : true),
      (unread) => {
        if (unread) {
          if (document.hasFocus()) {
            // acknowledge the message
            props.channel.ack();
          } else {
            // otherwise mark this location as the last read location
            if (!lastId()) {
              // (taking away one second from the seed)
              setLastId(ulid(decodeTime(props.channel.lastMessageId!) - 1));
            }
          }
        }
      },
    ),
  );

  // Mark as read on re-focus
  function onFocus() {
    if (props.channel.unread && (atEndRef ? atEndRef() : true)) {
      props.channel.ack();
    }
  }

  document.addEventListener("focus", onFocus);
  onCleanup(() => document.removeEventListener("focus", onFocus));

  // Register ack/jump latest
  createKeybind(KeybindAction.CHAT_JUMP_END, () => {
    // Mark channel as read if not already
    if (props.channel.unread) {
      props.channel.ack();
    }

    // Clear the last unread id
    if (lastId()) {
      setLastId(undefined);
    }

    // Scroll to the bottom
    jumpToBottomRef?.();
  });

  // Sidebar scroll target
  let sidebarScrollTargetElement!: HTMLDivElement;

  // Sidebar state
  const [sidebarState, setSidebarState] = createSignal<SidebarState>({
    state: "default",
  });

  // todo: in the future maybe persist per ID?
  createEffect(
    on(
      () => props.channel.id,
      () => setSidebarState({ state: "default" }),
    ),
  );

  return (
    <>
      <Header placement="primary">
        <ChannelHeader
          channel={props.channel}
          sidebarState={sidebarState}
          setSidebarState={setSidebarState}
        />
      </Header>
      <Content>
        <main class={main()}>
          <Show
            when={props.channel.isVoice}
            fallback={
              <BelowFloatingHeader>
                <div>
                  <NewMessages
                    lastId={lastId}
                    jumpBack={() => navigate(lastId()!)}
                    dismiss={() => setLastId()}
                  />
                </div>
              </BelowFloatingHeader>
            }
          >
            <InlineVoiceRoom channel={props.channel} />
          </Show>

          <ErrorBoundary
            fallback={(err, reset) => (
              <ErrorFallback
                error={err}
                reset={reset}
                label={t`Failed to load messages`}
              />
            )}
          >
            <Messages
              channel={props.channel}
              lastReadId={lastId}
              pendingMessages={(pendingProps) => (
                <DraftMessages
                  channel={props.channel}
                  tail={pendingProps.tail}
                  sentIds={pendingProps.ids}
                />
              )}
              typingIndicator={
                <TypingIndicator
                  users={props.channel.typing}
                  ownId={client().user!.id}
                />
              }
              highlightedMessageId={highlightMessageId}
              clearHighlightedMessage={() => navigate(".")}
              atEndRef={(ref) => (atEndRef = ref)}
              jumpToBottomRef={(ref) => (jumpToBottomRef = ref)}
            />
          </ErrorBoundary>

          <ErrorBoundary
            fallback={(err, reset) => (
              <ErrorFallback
                error={err}
                reset={reset}
                label={t`Failed to load editor`}
              />
            )}
          >
            <MessageComposition
              channel={props.channel}
              onMessageSend={() => jumpToBottomRef?.()}
            />
          </ErrorBoundary>
        </main>
        <Show
          when={
            (state.layout.getSectionState(
              LAYOUT_SECTIONS.MEMBER_SIDEBAR,
              true,
            ) &&
              props.channel.type !== "SavedMessages") ||
            sidebarState().state !== "default"
          }
        >
          <div
            data-member-sidebar
            ref={sidebarScrollTargetElement}
            use:scrollable={{
              direction: "y",
              showOnHover: true,
              class: sidebar(),
            }}
            style={{
              width: sidebarState().state !== "default" ? "360px" : "",
            }}
          >
            <Switch
              fallback={
                <MemberSidebar
                  channel={props.channel}
                  scrollTargetElement={sidebarScrollTargetElement}
                />
              }
            >
              <Match when={sidebarState().state === "search"}>
                <WideSidebarContainer>
                  <SidebarTitle>
                    <Text class="label" size="large">
                      <Trans>Search Results</Trans>
                    </Text>
                  </SidebarTitle>
                  <TextSearchSidebar
                    channel={props.channel}
                    query={parseSearchQuery(
                      (sidebarState() as { query: string }).query,
                      client(),
                    )}
                  />
                </WideSidebarContainer>
              </Match>
              <Match when={sidebarState().state === "pins"}>
                <WideSidebarContainer>
                  <SidebarTitle>
                    <Text class="label" size="large">
                      <Trans>Pinned Messages</Trans>
                    </Text>
                  </SidebarTitle>
                  <TextSearchSidebar
                    channel={props.channel}
                    query={{ pinned: true, sort: "Latest" }}
                  />
                </WideSidebarContainer>
              </Match>
            </Switch>

            <Show when={sidebarState().state !== "default"}>
              <Keybind
                keybind={KeybindAction.CLOSE_SIDEBAR}
                onPressed={() => setSidebarState({ state: "default" })}
              />
            </Show>
          </div>
        </Show>
      </Content>
    </>
  );
}

/**
 * Inline voice room rendering (replaces floating PiP)
 */
function InlineVoiceRoom(props: { channel: Channel }) {
  const voice = useVoice();

  // Voice channels require explicit user action to join (click in sidebar)
  // No auto-connect on page load/navigation — matches Discord/Revolt behavior

  const inThisChannel = () => voice.channel()?.id === props.channel.id;
  const inOtherChannel = () =>
    voice.channel() && voice.channel()?.id !== props.channel.id;

  return (
    <>
      <Show when={inThisChannel()}>
        <div
          class={css({
            width: "100%",
            height: "50vh",
            minHeight: "300px",
            flexShrink: 0,
            borderRadius: "10px",
            background: "var(--md-sys-color-surface-container-low)",
            border: "1px solid var(--pd-border-subtle)",
            overflow: "hidden",
          })}
        >
          <InlineActiveRoom />
        </div>
      </Show>
      <Show when={inOtherChannel()}>
        <div
          class={css({
            width: "100%",
            maxWidth: "360px",
            alignSelf: "center",
            flexShrink: 0,
            height: "120px",
            borderRadius: "10px",
            background: "var(--md-sys-color-surface-container-low)",
            border: "1px solid var(--pd-border-subtle)",
            cursor: "pointer",
          })}
        >
          <VoiceCallCardPreview channel={props.channel} />
        </div>
      </Show>
    </>
  );
}

/**
 * Inline active room — participant grid only, no status/actions (those are in VoiceBottomBar)
 */
function InlineActiveRoom() {
  return (
    <div
      class={css({
        height: "100%",
        width: "100%",
        overflowY: "auto",
      })}
    >
      <InRoom>
        <VoiceCallCardActiveRoom />
      </InRoom>
    </div>
  );
}

/**
 * Main content row layout
 */
const Content = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
  },
});

/**
 * Base styles
 */
const sidebar = cva({
  base: {
    flexShrink: 0,
    width: "var(--layout-width-channel-sidebar)",
    // margin: "var(--gap-md)",
    borderRadius: "var(--borderRadius-lg)",
    // color: "var(--colours-sidebar-channels-foreground)",
    // background: "var(--colours-sidebar-channels-background)",
  },
});

/**
 * Container styles
 */
const WideSidebarContainer = styled("div", {
  base: {
    paddingRight: "var(--gap-md)",
    width: "360px",
  },
});

/**
 * Sidebar title
 */
const SidebarTitle = styled("div", {
  base: {
    padding: "var(--gap-md)",
    color: "var(--md-sys-color-on-surface)",
  },
});
