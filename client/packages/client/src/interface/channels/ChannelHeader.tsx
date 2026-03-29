import { Accessor, Match, Setter, Show, Switch, createMemo, createResource } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import {
  Button,
  IconButton,
  NonBreakingText,
  OverflowingText,
  Spacer,
  UserStatus,
  typography,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdGroup from "@material-design-icons/svg/outlined/group.svg?component-solid";
import MdPersonAdd from "@material-design-icons/svg/outlined/person_add.svg?component-solid";
import MdSettings from "@material-design-icons/svg/outlined/settings.svg?component-solid";

import MdKeep from "../../svg/keep.svg?component-solid";
import { HeaderIcon } from "../common/CommonHeader";

import { SidebarState } from "./text/TextChannel";

interface Props {
  /**
   * Channel to render header for
   */
  channel: Channel;

  /**
   * Sidebar state
   */
  sidebarState?: Accessor<SidebarState>;

  /**
   * Set sidebar state
   */
  setSidebarState?: Setter<SidebarState>;
}

/**
 * Common channel header component
 */
export function ChannelHeader(props: Props) {
  const { openModal } = useModals();
  const client = useClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const state = useState();

  const parentChannel = createMemo(() => {
    const parentId = props.channel.parentId;
    if (!parentId) return undefined;
    return client()?.channels.get(parentId);
  });

  const [pinCount] = createResource(
    () => props.channel,
    async (ch) => {
      try {
        const pins = await ch.search({ pinned: true, limit: 100, sort: "Latest" });
        return pins.length;
      } catch {
        return 0;
      }
    },
  );

  const searchValue = () => {
    if (!props.sidebarState) return null;

    const state = props.sidebarState();
    if (state.state === "search") {
      return state.query;
    } else {
      return "";
    }
  };

  return (
    <>
      <Switch>
        <Match when={props.channel.isThread && parentChannel()}>
          <BackButton
            onClick={() => {
              const parent = parentChannel()!;
              navigate(`/server/${parent.serverId}/channel/${parent.id}`);
            }}
          >
            <Symbol size={18}>arrow_back</Symbol>
            <span>{parentChannel()!.name}</span>
          </BackButton>
          <Divider />
          <HeaderIcon>
            <Symbol>chat</Symbol>
          </HeaderIcon>
          <NonBreakingText class={typography({ class: "title", size: "medium" })}>
            <TextWithEmoji content={props.channel.name!} />
          </NonBreakingText>
        </Match>
        <Match when={props.channel.isForum}>
          <HeaderIcon>
            <Symbol>forum</Symbol>
          </HeaderIcon>
          <NonBreakingText
            class={typography({ class: "title", size: "medium" })}
          >
            <TextWithEmoji content={props.channel.name!} />
          </NonBreakingText>
          <Show when={props.channel.description}>
            <Divider />
            <OverflowingText
              class={typography({ class: "body", size: "small" })}
            >
              <TextWithEmoji content={props.channel.description!} />
            </OverflowingText>
          </Show>
        </Match>
        <Match
          when={
            props.channel.type === "TextChannel" ||
            props.channel.type === "Group"
          }
        >
          <HeaderIcon>
            <Symbol>grid_3x3</Symbol>
          </HeaderIcon>
          <NonBreakingText
            class={typography({ class: "title", size: "medium" })}
            onClick={() =>
              openModal({
                type: "channel_info",
                channel: props.channel,
              })
            }
          >
            <TextWithEmoji content={props.channel.name!} />
          </NonBreakingText>
          <Show when={props.channel.description}>
            <Divider />
            <a
              class={descriptionLink}
              onClick={() =>
                openModal({
                  type: "channel_info",
                  channel: props.channel,
                })
              }
              use:floating={{
                tooltip: {
                  placement: "bottom",
                  content: t`Click to show full description`,
                },
              }}
            >
              <OverflowingText
                class={typography({ class: "title", size: "small" })}
              >
                <TextWithEmoji
                  content={props.channel.description?.split("\n").shift()}
                />
              </OverflowingText>
            </a>
          </Show>
        </Match>
        <Match when={props.channel.type === "DirectMessage"}>
          <HeaderIcon>
            <Symbol>alternate_email</Symbol>
          </HeaderIcon>
          <TextWithEmoji content={props.channel.recipient?.username} />
          <UserStatus status={props.channel.recipient?.presence} size="8px" />
        </Match>
        <Match when={props.channel.type === "SavedMessages"}>
          <HeaderIcon>
            <Symbol>note_stack</Symbol>
          </HeaderIcon>
          <Trans>Saved Notes</Trans>
        </Match>
      </Switch>

      <Spacer />

      <Show
        when={
          (props.channel.type === "Group" || props.channel.serverId) &&
          props.channel.orPermission("ManageChannel", "ManagePermissions")
        }
      >
        <IconButton
          onPress={() =>
            openModal({
              type: "settings",
              config: "channel",
              context: props.channel,
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Channel Settings`,
            },
          }}
        >
          <MdSettings />
        </IconButton>
      </Show>

      <Show when={props.channel.type === "Group"}>
        <Button
          variant="text"
          size="icon"
          onPress={() =>
            openModal({
              type: "add_members_to_group",
              group: props.channel,
              client: client(),
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Add friends to group`,
            },
          }}
        >
          <MdPersonAdd />
        </Button>
      </Show>

      <Show when={props.sidebarState}>
        <PinButtonWrapper>
          <IconButton
            use:floating={{
              tooltip: {
                placement: "bottom",
                content: t`View pinned messages`,
              },
            }}
            onPress={() =>
              props.sidebarState!().state === "pins"
                ? props.setSidebarState!({
                    state: "default",
                  })
                : props.setSidebarState!({
                    state: "pins",
                  })
            }
          >
            <MdKeep />
          </IconButton>
          <Show when={pinCount() && pinCount()! > 0}>
            <PinBadge>{pinCount()}</PinBadge>
          </Show>
        </PinButtonWrapper>
      </Show>

      <Show when={props.sidebarState && props.channel.type !== "SavedMessages"}>
        <IconButton
          onPress={() => {
            if (props.sidebarState!().state === "default") {
              state.layout.toggleSectionState(
                LAYOUT_SECTIONS.MEMBER_SIDEBAR,
                true,
              );
            } else {
              state.layout.setSectionState(
                LAYOUT_SECTIONS.MEMBER_SIDEBAR,
                true,
                true,
              );

              props.setSidebarState!({
                state: "default",
              });
            }
          }}
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`View members`,
            },
          }}
        >
          <MdGroup />
        </IconButton>
      </Show>

      <Show when={searchValue() !== null}>
        <SearchWrapper>
          <input
            class={searchInput}
            placeholder="Поиск... (from: has: pinned: before: after:)"
            value={searchValue()!}
            onChange={(e) =>
              e.currentTarget.value
                ? props.setSidebarState!({
                    state: "search",
                    query: e.currentTarget.value,
                  })
                : props.setSidebarState!({
                    state: "default",
                  })
            }
          />
          <Show when={searchValue() && searchValue()!.length > 0}>
            <SearchHints>
              <Show when={!searchValue()!.includes("from:")}>
                <SearchChip onClick={() => {
                  const el = document.querySelector(`.${searchInput}`) as HTMLInputElement;
                  if (el) { el.value += " from:"; el.focus(); props.setSidebarState!({ state: "search", query: el.value }); }
                }}>from:</SearchChip>
              </Show>
              <Show when={!searchValue()!.includes("has:")}>
                <SearchChip onClick={() => {
                  const el = document.querySelector(`.${searchInput}`) as HTMLInputElement;
                  if (el) { el.value += " has:"; el.focus(); props.setSidebarState!({ state: "search", query: el.value }); }
                }}>has:</SearchChip>
              </Show>
              <Show when={!searchValue()!.includes("pinned:")}>
                <SearchChip onClick={() => {
                  const el = document.querySelector(`.${searchInput}`) as HTMLInputElement;
                  if (el) { el.value += " pinned:true"; el.focus(); props.setSidebarState!({ state: "search", query: el.value }); }
                }}>pinned:</SearchChip>
              </Show>
            </SearchHints>
          </Show>
        </SearchWrapper>
      </Show>
    </>
  );
}

/**
 * Vertical divider between name and topic
 */
const Divider = styled("div", {
  base: {
    height: "20px",
    margin: "0px 5px",
    paddingLeft: "1px",
    backgroundColor: "var(--md-sys-color-outline-variant)",
  },
});

/**
 * Wrapper for pin button to position badge
 */
const PinButtonWrapper = styled("div", {
  base: {
    position: "relative",
    display: "inline-flex",
  },
});

/**
 * Badge showing pinned message count
 */
const PinBadge = styled("span", {
  base: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    minWidth: "16px",
    height: "16px",
    padding: "0 4px",
    borderRadius: "8px",
    background: "var(--md-sys-color-error)",
    color: "var(--md-sys-color-on-error)",
    fontSize: "10px",
    fontWeight: 700,
    lineHeight: "16px",
    textAlign: "center",
    pointerEvents: "none",
  },
});

/**
 * Back button for thread channels
 */
const BackButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "var(--md-sys-color-primary)",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
});

/**
 * Search wrapper
 */
const SearchWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    position: "relative",
  },
});

const searchInput = css({
  height: "40px",
  width: "280px",
  paddingInline: "16px",
  borderRadius: "var(--borderRadius-full)",
  background: "var(--md-sys-color-surface-container-high)",
  color: "var(--md-sys-color-on-surface)",
  border: "none",
  outline: "none",
  fontSize: "13px",
  "&::placeholder": {
    fontSize: "12px",
  },
});

const SearchHints = styled("div", {
  base: {
    display: "flex",
    gap: "4px",
    position: "absolute",
    top: "44px",
    right: 0,
    zIndex: 10,
  },
});

const SearchChip = styled("button", {
  base: {
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "var(--md-sys-color-secondary-container)",
    color: "var(--md-sys-color-on-secondary-container)",
    transition: "all 0.15s",
    "&:hover": {
      background: "var(--md-sys-color-primary)",
      color: "var(--md-sys-color-on-primary)",
    },
  },
});

/**
 * Link for the description
 */
const descriptionLink = css({
  minWidth: 0,
});
