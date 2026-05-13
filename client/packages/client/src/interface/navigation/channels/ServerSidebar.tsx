import { BiRegularCheckCircle, BiSolidCheckCircle } from "solid-icons/bi";
import {
  Accessor,
  JSX,
  Match,
  Setter,
  Show,
  Switch,
  createMemo,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import type { API, Channel, Server, ServerFlags } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import {
  Column,
  Draggable,
  Header,
  IconButton,
  MenuButton,
  OverflowingText,
  Row,
  Tooltip,
  iconSize,
  typography,
} from "@revolt/ui";
import { VoiceChannelPreview } from "@revolt/ui/components/features/voice/VoiceChannelPreview";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdChevronRight from "@material-design-icons/svg/filled/chevron_right.svg?component-solid";

import { getGameActivity } from "@revolt/app/gameActivity";

import { SidebarBase } from "./common";

const TRIGGER_MARKER = "[TRIGGER:TEMP_VOICE]";
const TEMP_MARKER_PREFIX = "[TEMP_VOICE:";

function isTriggerChannel(channel: Channel): boolean {
  return !!channel.description?.includes(TRIGGER_MARKER);
}

function isTempChannel(channel: Channel): boolean {
  return !!channel.description?.includes(TEMP_MARKER_PREFIX);
}

function getTempCreatorId(channel: Channel): string | null {
  const match = channel.description?.match(/\[TEMP_VOICE:([A-Z0-9]+)\]/);
  return match ? match[1] : null;
}

interface Props {
  /**
   * Server to display sidebar for
   */
  server: Server;

  /**
   * Currently selected channel ID
   */
  channelId: string | undefined;

  /**
   * Open server information modal
   */
  openServerInfo: () => void;

  /**
   * Open server settings modal
   */
  openServerSettings: () => void;

  /**
   * Menu generator
   */
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}

/**
 * Ordered category data returned from server
 */
type CategoryData = Omit<API.Category, "channels"> & { channels: Channel[] };

type OrderingEvent =
  | {
      type: "categories";
      ids: string[];
    }
  | {
      type: "category";
      id: string;
      channelIds: string[];
      moved: boolean;
    };

/**
 * Display server information and channels
 */
export const ServerSidebar = (props: Props) => {
  // Users can manage certain parts of the server individually, regardless of their ManageServer Permission
  const canManageServer = () =>
    props.server.orPermission(
      "ManageServer",
      "ManageCustomisation",
      "ManageRole",
      "ManagePermissions",
    );

  // TODO: when navigating channels, we want to add aria-keyshortcuts={localized-shortcut} to the next/previous channels
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts
  // TODO: issue warning if nothing is found somehow? warnings can be nicer than flat out not working
  createKeybind(KeybindAction.CHAT_MARK_SERVER_AS_READ, () => {
    if (props.server.unread) {
      props.server.ack();
    }
  });

  const noOrdering = () => !props.server.havePermission("ManageChannel");

  let heldEvent: OrderingEvent & { type: "category" } = null!;
  function handleOrdering(event: OrderingEvent) {
    if (event.type === "category" && event.moved && !heldEvent) {
      heldEvent = event;
      return;
    }

    const normalisedCategories = props.server.orderedChannels.map(
      (category) => ({
        ...category,
        channels: category.channels.map((channel) => channel.id),
      }),
    );

    if (event.type === "categories") {
      props.server.edit({
        categories: event.ids
          .map((id) => normalisedCategories.find((cat) => cat.id === id)!)
          .filter((cat) => cat),
      });
    } else {
      props.server.edit({
        categories: normalisedCategories.map((category) => {
          if (heldEvent && category.id === heldEvent.id) {
            return {
              ...category,
              channels: heldEvent.channelIds,
            };
          } else if (category.id === event.id) {
            return {
              ...category,
              channels: event.channelIds,
            };
          } else {
            return category;
          }
        }),
      });

      heldEvent = null!;
    }
  }

  return (
    <SidebarBase use:floating={props.menuGenerator(props.server)}>
      <Switch
        fallback={
          <Header placement="secondary">
            <ServerInfo
              server={props.server}
              canManageServer={canManageServer()}
              openServerInfo={props.openServerInfo}
              openServerSettings={props.openServerSettings}
            />
          </Header>
        }
      >
        <Match when={props.server.banner}>
          <Header
            image
            placement="secondary"
            style={{
              background: `url('${props.server.bannerURL}')`,
            }}
          >
            <ServerInfo
              server={props.server}
              canManageServer={canManageServer()}
              openServerInfo={props.openServerInfo}
              openServerSettings={props.openServerSettings}
            />
          </Header>
        </Match>
      </Switch>
      <div
        use:invisibleScrollable
        style={{ "flex-grow": 1 }}
        use:floating={props.menuGenerator(props.server)}
      >
        <Draggable
          dragHandles
          type="category"
          disabled={noOrdering()}
          items={props.server.orderedChannels}
          onChange={(ids) => handleOrdering({ type: "categories", ids })}
        >
          {(entry) => (
            <Category
              server={props.server}
              category={entry.item}
              channelId={props.channelId}
              menuGenerator={props.menuGenerator}
              dragDisabled={entry.dragDisabled}
              setDragDisabled={entry.setDragDisabled}
              noOrdering={noOrdering}
              handleOrdering={handleOrdering}
            />
          )}
        </Draggable>
      </div>
    </SidebarBase>
  );
};

/**
 * Server Information
 */
function ServerInfo(
  props: Pick<Props, "server" | "openServerInfo" | "openServerSettings"> & {
    canManageServer: boolean;
  },
) {
  const { t } = useLingui();
  const { openModal } = useModals();

  return (
    <Row align grow minWidth={0}>
      <ServerBadge flags={props.server.flags} />
      <ServerName onClick={props.openServerInfo}>
        <TextWithEmoji content={props.server.name} />
      </ServerName>
      <Show when={props.server.havePermission("ManageChannel")}>
        <HeaderActionButton
          banner={!!props.server.banner}
          onClick={() =>
            openModal({
              type: "create_channel",
              server: props.server,
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Create channel`,
            },
          }}
        >
          <Symbol size={18}>add</Symbol>
        </HeaderActionButton>
      </Show>
      <Show when={props.canManageServer}>
        <HeaderActionButton
          banner={!!props.server.banner}
          onClick={props.openServerSettings}
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Server settings`,
            },
          }}
        >
          <Symbol size={18}>settings</Symbol>
        </HeaderActionButton>
      </Show>
    </Row>
  );
}

/**
 * Action button in server header with backdrop for banner visibility
 */
const HeaderActionButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "var(--borderRadius-sm)",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all var(--transition-fast)",
    color: "var(--md-sys-color-on-surface)",
    background: "transparent",
    padding: 0,

    "&:hover": {
      background: "color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent)",
    },
  },
  variants: {
    banner: {
      true: {
        background: "rgba(0, 0, 0, 0.4)",
        color: "#fff",
        backdropFilter: "blur(4px)",

        "&:hover": {
          background: "rgba(0, 0, 0, 0.6)",
        },
      },
    },
  },
});

/**
 * Server name
 */
const ServerName = styled("a", {
  base: {
    flexGrow: 1,
    minWidth: 0,

    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

/**
 * Server badge
 */
function ServerBadge(props: { flags: ServerFlags }) {
  const { t } = useLingui();

  return (
    <Show when={props.flags}>
      <Tooltip
        content={props.flags === 1 ? t`Official Server` : t`Verified`}
        placement="top"
      >
        {props.flags === 1 ? (
          <BiSolidCheckCircle size={12} />
        ) : (
          <BiRegularCheckCircle size={12} />
        )}
      </Tooltip>
    </Show>
  );
}

/**
 * Single category entry
 */
function Category(
  props: {
    server: Server;
    category: CategoryData;
    channelId: string | undefined;
    noOrdering: Accessor<boolean>;
    handleOrdering: (event: OrderingEvent) => void;
  } & Pick<Props, "menuGenerator"> & {
      dragDisabled: Accessor<boolean>;
      setDragDisabled: Setter<boolean>;
    },
) {
  const state = useState();
  const isOpen = () => state.layout.getSectionState(props.category.id, true);

  const channels = createMemo(() =>
    props.category.channels.filter(
      (channel) =>
        !channel.isThread &&
        (props.category.id === "default" ||
        isOpen() ||
        channel.unread ||
        channel.id === props.channelId),
    ),
  );

  return (
    <CategorySection>
      <Show when={props.category.id !== "default"}>
        <div use:floating={props.menuGenerator(props.category as never)}>
          <CategoryBase
            open={isOpen()}
            onClick={() => {
              state.layout.toggleSectionState(props.category.id, true);
            }}
            {...createDragHandle(props.dragDisabled, props.setDragDisabled)}
          >
            {props.category.title}
            <MdChevronRight {...iconSize(12)} />
          </CategoryBase>
        </div>
      </Show>
      <Draggable
        type="channels"
        items={channels()}
        onChange={(channelIds) => {
          const current = channels();
          props.handleOrdering({
            type: "category",
            id: props.category.id,
            channelIds,
            moved: channelIds.length !== current.length,
          });
        }}
        disabled={props.noOrdering() || !isOpen()}
        minimumDropAreaHeight="32px"
      >
        {(entry) => (
          <Entry
            channel={entry.item}
            active={entry.item.id === props.channelId}
            menuGenerator={props.menuGenerator}
          />
        )}
      </Draggable>
    </CategorySection>
  );
}

const CategorySection = styled("div", {
  base: {
    display: "flex",
    gap: "2px",
    flexDirection: "column",
    paddingBlock: "var(--gap-sm)",
    borderRadius: "var(--borderRadius-sm)",
  },
});

/**
 * Category title styling
 */
const CategoryBase = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",

    padding: "0 12px",
    paddingTop: "12px",
    paddingBottom: "4px",

    cursor: "pointer",
    userSelect: "none",
    transition: "color 140ms cubic-bezier(0.2,0,0,1)",

    "--color": "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
    color: "var(--color)",
    fill: "var(--color)",

    ...typography.raw({ class: "label", size: "small" }),
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",

    "&:hover": {
      "--color": "var(--md-sys-color-on-surface)",
    },

    "& svg": {
      transition: "transform 140ms cubic-bezier(0.2,0,0,1)",
    },
  },
  variants: {
    open: {
      true: {
        "& svg": {
          transform: "rotateZ(90deg)",
        },
      },
    },
  },
});

/**
 * Server channel entry
 */
function Entry(
  props: { channel: Channel; active: boolean } & Pick<Props, "menuGenerator">,
) {
  const { t } = useLingui();
  const state = useState();
  const client = useClient();
  const voice = useVoice();
  const navigate = useNavigate();
  const { openModal } = useModals();

  const canEditChannel = createMemo(() =>
    (["ManageChannel", "ManagePermissions", "ManageWebhooks"] as const).some(
      (perm) => props.channel.server?.havePermission(perm),
    ),
  );

  const canInvite = createMemo(() =>
    props.channel.server?.havePermission("InviteOthers"),
  );

  const alertState = createMemo(
    () =>
      !props.active &&
      props.channel.unread &&
      (props.channel.mentions?.size || true),
  );

  const inCall = () => props.channel.id === voice.channel()?.id;

  const attentionState = createMemo(() =>
    props.active
      ? "selected"
      : inCall()
        ? "selected"
        : state.notifications.isChannelMuted(props.channel)
          ? "muted"
          : props.channel.unread
            ? "active"
            : "normal",
  );

  const isTrigger = () => isTriggerChannel(props.channel);
  const isTemp = () => isTempChannel(props.channel);
  const tempCreator = () => getTempCreatorId(props.channel);

  const handleClick = async (e: MouseEvent) => {
    if (isTrigger()) {
      e.preventDefault();
      const server = props.channel.server;
      if (!server) return;
      const c = client();
      const userId = c?.user?.id;
      if (!userId) return;
      const gameActivity = getGameActivity();
      const defaultName = gameActivity || c.user?.displayName || c.user?.username || "Voice";

      openModal({
        type: "create_temp_channel",
        defaultName,
        onConfirm: async (channelName: string, maxUsers?: number) => {
          try {
            const newChannel = await server.createChannel({
              type: "Voice",
              name: channelName,
              description: `[TEMP_VOICE:${userId}]`,
              ...(maxUsers ? { voice: { max_users: maxUsers } } : {}),
            });

            // Place the new channel right after the trigger channel
            try {
              const triggerId = props.channel.id;
              const categories = server.orderedChannels
                .filter((cat) => cat.id !== "default")
                .map((cat) => ({
                  id: cat.id,
                  title: cat.title,
                  channels: cat.channels.map((ch) => ch.id),
                }));

              for (const cat of categories) {
                const triggerIdx = cat.channels.indexOf(triggerId);
                if (triggerIdx !== -1) {
                  // Remove new channel from wherever it was placed
                  cat.channels = cat.channels.filter((id) => id !== newChannel.id);
                  // Insert right after trigger
                  cat.channels.splice(triggerIdx + 1, 0, newChannel.id);
                  break;
                }
              }

              await server.edit({ categories });
            } catch {
              // Non-critical — channel still works, just wrong position
            }

            voice.connect(newChannel);
            navigate(`/server/${newChannel.serverId}/channel/${newChannel.id}`);
          } catch (err) {
            console.error("[TEMP] Failed to create temp channel:", err);
          }
        },
      });
      return;
    }
    if (props.channel.isVoice) {
      e.preventDefault();
      if (voice.channel()?.id !== props.channel.id) {
        voice.connect(props.channel);
      }
      navigate(`/server/${props.channel.serverId}/channel/${props.channel.id}`);
    }
  };

  return (
    <a href={`/server/${props.channel.serverId}/channel/${props.channel.id}`} onClick={handleClick}>
      <Column gap="sm">
        <MenuButton
          use:floating={props.menuGenerator(props.channel)}
          size="normal"
          alert={alertState()}
          attention={attentionState()}
          icon={
            <>
              <Switch fallback={<Symbol>grid_3x3</Symbol>}>
                <Match when={isTrigger()}>
                  <Symbol color="var(--md-sys-color-tertiary)">
                    add_circle
                  </Symbol>
                </Match>
                <Match when={isTemp()}>
                  <Symbol
                    color={inCall() ? "var(--md-sys-color-primary)" : undefined}
                  >
                    schedule
                  </Symbol>
                </Match>
                <Match when={props.channel.isForum}>
                  <Symbol>forum</Symbol>
                </Match>
                <Match when={props.channel.isVoice}>
                  <Symbol
                    color={inCall() ? "var(--md-sys-color-primary)" : undefined}
                  >
                    headset_mic
                  </Symbol>
                </Match>
              </Switch>
              <Show when={props.channel.icon}>
                <ChannelIcon
                  src={props.channel.iconURL}
                  css={{ marginEnd: "0.2em" }}
                />
              </Show>
            </>
          }
          actions={
            <>
              <Show when={isTemp() && tempCreator() === client()?.user?.id}>
                <a
                  use:floating={{
                    tooltip: { placement: "top", content: t`Rename Channel` },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    const newName = prompt(t`Enter new channel name:`);
                    if (newName && newName.trim()) {
                      props.channel.edit({ name: newName.trim() });
                    }
                  }}
                >
                  <Symbol size={16} fill>
                    edit
                  </Symbol>
                </a>
              </Show>
              <Show when={canInvite()}>
                <a
                  use:floating={{
                    tooltip: { placement: "top", content: t`Create Invite` },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    openModal({
                      type: "create_invite",
                      channel: props.channel,
                    });
                  }}
                >
                  <Symbol size={16} fill>
                    person_add
                  </Symbol>
                </a>
              </Show>

              <Show when={canEditChannel()}>
                <a
                  use:floating={{
                    tooltip: { placement: "top", content: t`Edit Channel` },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    openModal({
                      type: "settings",
                      config: "channel",
                      context: props.channel,
                    });
                  }}
                >
                  <Symbol size={16} fill>
                    settings
                  </Symbol>
                </a>
              </Show>
            </>
          }
        >
          <Show when={props.channel.description} fallback={
            <OverflowingText>
              <TextWithEmoji content={props.channel.name!} />
            </OverflowingText>
          }>
            <Tooltip content={props.channel.description!} placement="right">
              <OverflowingText>
                <TextWithEmoji content={props.channel.name!} />
              </OverflowingText>
            </Tooltip>
          </Show>
          <Show when={inCall()}>
            <Symbol size={16} color="var(--md-sys-color-primary)">call</Symbol>
          </Show>
        </MenuButton>

        <VoiceChannelPreview channel={props.channel} />
      </Column>
    </a>
  );
}

/**
 * Channel icon styling
 */
const ChannelIcon = styled("img", {
  base: {
    width: "16px",
    height: "16px",
    objectFit: "contain",
  },
});
