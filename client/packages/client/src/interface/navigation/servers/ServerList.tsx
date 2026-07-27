import { Accessor, For, JSX, Show, createMemo, createSignal } from "solid-js";
import { Compass, Home, Plus, Settings } from "lucide-solid";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Channel, Server, User } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar, Column, Text, Time, Unreads, UserStatus } from "@revolt/ui";

import { Tooltip } from "../../../../components/ui/components/floating";
import { Draggable } from "../../../../components/ui/components/utils/Draggable";

import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { UserMenu } from "./UserMenu";

interface Props {
  /**
   * Ordered server list
   */
  orderedServers: Server[];

  /**
   * Set server ordering
   * @param ids List of IDs
   */
  setServerOrder: (ids: string[]) => void;

  /**
   * Unread conversations list
   */
  unreadConversations: Channel[];

  /**
   * Current logged in user
   */
  user: User;

  /**
   * Selected server id
   */
  selectedServer: Accessor<string | undefined>;

  /**
   * Create or join server
   */
  onCreateOrJoinServer(): void;

  /**
   * Menu generator
   */
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}

/**
 * Server list sidebar component
 */
export const ServerList = (props: Props) => {
  const { t } = useLingui();
  const state = useState();
  const client = useClient();
  const navigate = useNavigate();
  const { openModal } = useModals();

  const navigateServer = (byOffset: number) => {
    const serverId = props.selectedServer();
    if (serverId == null && props.orderedServers.length) {
      if (byOffset === 1) {
        navigate(`/server/${props.orderedServers[0].id}`);
      } else {
        navigate(
          `/server/${props.orderedServers[props.orderedServers.length - 1].id}`,
        );
      }
      return;
    }

    const currentServerIndex = props.orderedServers.findIndex(
      (server) => server.id === serverId,
    );

    const nextIndex = currentServerIndex + byOffset;

    if (nextIndex === -1) {
      return navigate("/");
    }

    // this will wrap the index around
    const nextServer = props.orderedServers.at(
      nextIndex % props.orderedServers.length,
    );

    if (nextServer) {
      navigate(`/server/${nextServer.id}`);
    }
  };

  createKeybind(KeybindAction.NAVIGATION_SERVER_UP, () => navigateServer(-1));
  createKeybind(KeybindAction.NAVIGATION_SERVER_DOWN, () => navigateServer(1));

  const homeNotifications = createMemo(() => {
    return client().users.filter((user) => user.relationship === "Incoming")
      .length;
  });

  // Ref for floating menu
  const [menuButton, setMenuButton] = createSignal<HTMLDivElement>();

  return (
    <ServerListBase>
      <div use:invisibleScrollable={{ direction: "y", class: listBase() }}>
        <a
          class={entryContainer({
            indicator: !props.selectedServer() ? "selected" : undefined,
          })}
          href="/"
          use:floating={{
            tooltip: {
              content: `You have ${homeNotifications()} pending friend requests.`,
              placement: "right",
            },
          }}
        >
          <RailAction>
            <Home size={22} stroke-width={1.75} />
            <Show when={homeNotifications()}>
              <RailBadge>{homeNotifications()}</RailBadge>
            </Show>
          </RailAction>
        </a>
        <Tooltip
          placement="right"
          content={() => (
            <Column>
              <span>{props.user.username}</span>
              <Text class="label" size="small">
                {props.user.presence}
              </Text>
            </Column>
          )}
          aria={props.user.username}
        >
          <a ref={setMenuButton} class={entryContainer()}>
            <Avatar
              size={42}
              src={props.user.avatarURL}
              holepunch={"bottom-right"}
              overlay={<UserStatus.Graphic status={props.user.presence} />}
              interactive
            />
          </a>
          <UserMenu anchor={menuButton} />
        </Tooltip>
        <For each={props.unreadConversations.slice(0, 9)}>
          {(conversation) => (
            <Tooltip placement="right" content={conversation.displayName}>
              <a
                class={entryContainer()}
                use:floating={props.menuGenerator(conversation)}
                href={`/channel/${conversation.id}`}
              >
                <Avatar
                  size={42}
                  // TODO: fix this
                  src={conversation.iconURL}
                  holepunch={conversation.unread ? "top-right" : "none"}
                  overlay={
                    <>
                      <Show when={conversation.unread}>
                        <Unreads.Graphic
                          count={conversation.mentions?.size ?? 0}
                          unread
                        />
                      </Show>
                    </>
                  }
                  fallback={
                    conversation.name ?? conversation.recipient?.username
                  }
                  interactive
                />
              </a>
            </Tooltip>
          )}
        </For>
        <Show when={props.unreadConversations.length > 9}>
          <a class={entryContainer()} href={`/`}>
            <RailAction>
              <RailCount>+{props.unreadConversations.length - 9}</RailCount>
            </RailAction>
          </a>
        </Show>
        <LineDivider />
        <Draggable
          type="servers"
          items={props.orderedServers}
          onChange={props.setServerOrder}
        >
          {(entry) => (
            <Tooltip
              placement="right"
              content={() => (
                <Column>
                  <Text class="label" size="large">
                    {entry.item.name}
                  </Text>{" "}
                  <Show when={state.notifications.isMuted(entry.item)}>
                    <Text class="label" size="small">
                      <Show
                        when={
                          state.notifications.getServerMute(entry.item)!.until
                        }
                        fallback={<Trans>Muted</Trans>}
                      >
                        <Trans>
                          Muted until{" "}
                          <Time
                            format="datetime"
                            value={
                              state.notifications.getServerMute(entry.item)!
                                .until
                            }
                          />
                        </Trans>
                      </Show>
                    </Text>
                  </Show>
                </Column>
              )}
              aria={entry.item.name}
            >
              <div
                class={entryContainer({
                  indicator:
                    props.selectedServer() === entry.item.id
                      ? "selected"
                      : entry.item.unread
                        ? "alert"
                        : undefined,
                })}
                use:floating={props.menuGenerator(entry.item)}
              >
                <a href={state.layout.getLastActiveServerPath(entry.item.id)}>
                  <Avatar
                    size={42}
                    shape="rounded-square"
                    src={entry.item.iconURL}
                    holepunch={
                      entry.item.mentions.length ? "top-right" : "none"
                    }
                    overlay={
                      <>
                        <Show
                          when={
                            entry.item.mentions
                              .length /* as opposed to item.unread */
                          }
                        >
                          <Unreads.Graphic
                            count={entry.item.mentions.length}
                            unread
                          />
                        </Show>
                      </>
                    }
                    fallback={entry.item.name}
                    interactive
                  />
                </a>
              </div>
            </Tooltip>
          )}
        </Draggable>
        <Tooltip placement="right" content={t`Create or join a server`}>
          <a
            class={entryContainer()}
            onClick={() => props.onCreateOrJoinServer()}
          >
            <RailAction>
              <Plus size={22} stroke-width={1.75} />
            </RailAction>
          </a>
        </Tooltip>
        <Tooltip placement="right" content={t`Browse servers`}>
          <a class={entryContainer()} href="/discover">
            <RailAction>
              <Compass size={22} stroke-width={1.75} />
            </RailAction>
          </a>
        </Tooltip>
      </div>
      <Shadow>
        <div />
      </Shadow>
      <Tooltip placement="right" content={t`Settings`}>
        <a
          class={entryContainer()}
          onClick={() => openModal({ type: "settings", config: "user" })}
        >
          <RailAction>
            <Settings size={22} stroke-width={1.75} />
          </RailAction>
        </a>
      </Tooltip>
    </ServerListBase>
  );
};

/**
 * Server list container
 */
const ServerListBase = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",

    fill: "var(--md-sys-color-on-surface)",
    /* Flat dark rail — same surface as the rest, no gradient. */
    background: "var(--md-sys-color-surface)",
    borderRight: "1px solid var(--pd-border-subtle)",
  },
});

/**
 * Container around list of servers
 */
const listBase = cva({
  base: {
    flexGrow: 1,
  },
});

/**
 * Server entries
 */
const entryContainer = cva({
  base: {
    width: "56px",
    height: "52px",
    position: "relative",
    display: "grid",
    flexShrink: 0,
    placeItems: "center",

    "&:before": {
      content: "' '",
      position: "absolute",
      width: "3px",
      height: "0px",
      left: "0px",
      borderRadius: "0 var(--pd-radius-xs) var(--pd-radius-xs) 0",
      background: "var(--md-sys-color-on-surface)",
      transition:
        "height var(--pd-transition-base), opacity var(--pd-transition-base), background-color var(--pd-transition-base)",
      opacity: 0,
    },

    "&:hover:before": {
      height: "16px",
      opacity: 0.6,
    },

    "&:hover > a > svg": {
      transform: "scale(1.05)",
    },

    "& > a > svg": {
      transition: "transform var(--pd-transition-fast)",
    },
  },
  variants: {
    indicator: {
      selected: {
        /*
         * Where you are is the accent; what wants you is neutral. The rail
         * used to be the other way round -- neutral for the open server,
         * accent for unread -- which pointed the one loud colour in the app
         * at everything except the thing you were looking at.
         *
         * Both :before and :hover:before are set so the hover height does not
         * shrink the rail back down on the server you are already in. That is
         * what the two !important flags here were compensating for.
         */
        "&:before, &:hover:before": {
          height: "28px",
          background: "var(--md-sys-color-primary)",
          opacity: 1,
        },
      },
      alert: {
        "&:before": {
          height: "8px",
          opacity: 0.85,
        },
      },
    },
  },
});

/*
 * A rail ACTION, as opposed to a rail avatar.
 *
 * Home, Add, Discover and Settings used to be drawn by the Avatar component
 * with an icon fallback -- a beige disc with a thin glyph inside, which is
 * exactly what a disabled placeholder looks like. Content (servers, people)
 * and actions (buttons) must not share a body: avatars are pictures, these
 * are controls, and a control answers the pointer.
 */
const RailAction = styled("span", {
  base: {
    position: "relative",
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",

    borderRadius: "var(--pd-radius-squircle)",
    color: "var(--md-sys-color-on-surface-variant)",
    fill: "var(--md-sys-color-on-surface-variant)",
    background: "transparent",

    transition:
      "background-color var(--pd-transition-fast), color var(--pd-transition-fast)",

    _hover: {
      background: "var(--pd-tint-subtle)",
      color: "var(--md-sys-color-on-surface)",
      fill: "var(--md-sys-color-on-surface)",
    },
  },
});

/**
 * Pending-request count on the home action. Accent pill with a surface ring
 * so it reads above whatever sits behind it.
 */
const RailBadge = styled("span", {
  base: {
    position: "absolute",
    top: "-2px",
    insetInlineEnd: "-2px",
    minWidth: "16px",
    height: "16px",
    padding: "0 4px",

    borderRadius: "var(--pd-radius-pill)",
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
    boxShadow: "0 0 0 2px var(--md-sys-color-surface)",

    fontFamily: "var(--pd-font-mono)",
    fontSize: "10px",
    lineHeight: "16px",
    fontVariantNumeric: "tabular-nums",
    textAlign: "center",
  },
});

const RailCount = styled("span", {
  base: {
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-sm)",
    fontVariantNumeric: "tabular-nums",
  },
});

/**
 * Divider line between two lists
 */
const LineDivider = styled("div", {
  base: {
    height: "1px",
    flexShrink: 0,
    margin: "8px 14px",
    background: "var(--pd-border-subtle)",
  },
});

/**
 * Shadow at the bottom of the list
 */
const Shadow = styled("div", {
  base: {
    height: 0,
    zIndex: 1,
    position: "relative",

    "& div": {
      height: "12px",
      marginTop: "-12px",
      position: "absolute",
      // Fades into the rail's own surface. It was fading to
      // surface-container-highest, a colour the rail does not use, so the
      // "scroll continues below" hint showed up as a grey smudge instead.
      background:
        "linear-gradient(to bottom, transparent, var(--md-sys-color-surface))",
    },
  },
});
