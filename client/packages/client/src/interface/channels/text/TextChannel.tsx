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

import { Trans } from "@lingui-solid/solid/macro";
import { css, cva } from "styled-system/css";
import { Channel } from "stoat.js";
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
 * Channel component
 */
export function TextChannel(props: ChannelPageProps) {
  const state = useState();
  const client = useClient();

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
                label="Не удалось загрузить сообщения"
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
                label="Не удалось загрузить редактор"
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
                    query={{
                      query: (sidebarState() as { query: string }).query,
                    }}
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

  // Auto-connect only on initial mount (not reactively)
  // This prevents re-connecting when another channel's connect() triggers intermediate states
  onMount(() => {
    if (
      props.channel.isVoice &&
      voice.state() === "READY" &&
      !voice.channel()
    ) {
      voice.connect(props.channel);
    }
  });

  const inThisChannel = () => voice.channel()?.id === props.channel.id;
  const inOtherChannel = () =>
    voice.channel() && voice.channel()?.id !== props.channel.id;

  return (
    <>
      <Show when={inThisChannel()}>
        <div
          class={css({
            width: "100%",
            height: "40vh",
            flexShrink: 0,
            borderRadius: "var(--borderRadius-lg)",
            background: "var(--md-sys-color-secondary-container)",
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
            borderRadius: "var(--borderRadius-lg)",
            background: "var(--md-sys-color-secondary-container)",
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
