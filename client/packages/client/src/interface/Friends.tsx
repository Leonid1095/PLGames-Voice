import {
  Accessor,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import type { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import {
  Avatar,
  Badge,
  Deferred,
  Header,
  IconButton,
  List,
  ListSubheader,
  NavigationRail,
  NavigationRailItem,
  UserStatus,
  main,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { HeaderIcon } from "./common/CommonHeader";

/**
 * Base layout of the friends page
 */
const Base = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    flexDirection: "column",

    "& .FriendsList": {
      height: "100%",
      paddingInline: "var(--gap-lg)",
      animationName: "contentFadeIn",
      animationDuration: "0.4s",
      animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
      animationFillMode: "both",
    },
  },
});

/**
 * Friends menu
 */
export function Friends() {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  /**
   * Reference to the parent scroll container
   */
  let scrollTargetElement!: HTMLDivElement;

  /**
   * Signal required for reacting to ref changes
   */
  const targetSignal = () => scrollTargetElement;

  /**
   * Generate lists of all users
   */
  const lists = createMemo(() => {
    const list = client()!.users.toList();

    const friends = list
      .filter((user) => user.relationship === "Friend")
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
      friends,
      online: friends.filter((user) => user.online),
      incoming: list
        .filter((user) => user.relationship === "Incoming")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      outgoing: list
        .filter((user) => user.relationship === "Outgoing")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      blocked: list
        .filter((user) => user.relationship === "Blocked")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  });

  const pending = () => {
    const incoming = lists().incoming;
    return incoming.length > 99 ? "99+" : incoming.length;
  };

  const [page, setPage] = createSignal("online");

  return (
    <Base>
      <Header placement="primary">
        <HeaderIcon>
          <Symbol>group</Symbol>
        </HeaderIcon>
        <Trans>Friends</Trans>
      </Header>

      <main class={main()}>
        <div
          style={{
            position: "relative",
            display: "flex",
            "min-height": 0,
            height: "100%",
            "min-width": 0,
          }}
        >
          <NavigationRail contained value={page} onValue={setPage}>
            <div style={{ "margin-top": "6px", "margin-bottom": "12px" }}>
              <IconButton
                variant="filled"
                shape="square"
                onPress={() =>
                  openModal({
                    type: "add_friend",
                    client: client(),
                  })
                }
                use:floating={{
                  tooltip: {
                    placement: "right",
                    content: t`Add a new friend`,
                  },
                }}
              >
                <Symbol>add</Symbol>
              </IconButton>
            </div>

            <NavigationRailItem
              icon={<Symbol>circle</Symbol>}
              value="online"
            >
              <Trans>Online</Trans>
            </NavigationRailItem>
            <NavigationRailItem icon={<Symbol>group</Symbol>} value="all">
              <Trans>All</Trans>
            </NavigationRailItem>
            <NavigationRailItem
              icon={<Symbol>person_add</Symbol>}
              value="pending"
            >
              <Trans>Pending</Trans>
              <Show when={pending()}>
                <Badge slot="badge" variant="large">
                  {pending()}
                </Badge>
              </Show>
            </NavigationRailItem>
            <NavigationRailItem icon={<Symbol>block</Symbol>} value="blocked">
              <Trans>Blocked</Trans>
            </NavigationRailItem>
          </NavigationRail>

          <Deferred>
            <div class="FriendsList" ref={scrollTargetElement} use:scrollable>
              <Switch
                fallback={
                  <People
                    title={t`Online`}
                    users={lists().online}
                    scrollTargetElement={targetSignal}
                  />
                }
              >
                <Match when={page() === "all"}>
                  <People
                    title={t`All`}
                    users={lists().friends}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
                <Match when={page() === "pending"}>
                  <People
                    title={t`Incoming`}
                    users={lists().incoming}
                    scrollTargetElement={targetSignal}
                  />
                  <People
                    title={t`Outgoing`}
                    users={lists().outgoing}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
                <Match when={page() === "blocked"}>
                  <People
                    title={t`Blocked`}
                    users={lists().blocked}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
              </Switch>
            </div>
          </Deferred>
        </div>
      </main>
    </Base>
  );
}

/**
 * List of users
 */
function People(props: {
  users: User[];
  title: string;
  scrollTargetElement: Accessor<HTMLDivElement>;
}) {
  return (
    <List>
      <ListSubheader>
        {props.title} {"–"} {props.users.length}
      </ListSubheader>

      <Show when={props.users.length === 0}>
        <EmptyState>
          <Symbol size={32}>person_off</Symbol>
          <Trans>Nobody here right now!</Trans>
        </EmptyState>
      </Show>

      <VirtualContainer
        items={props.users}
        scrollTarget={props.scrollTargetElement()}
        itemSize={{ height: 64 }}
      >
        {(item) => (
          <ContainerListEntry style={{ ...item.style }}>
            <Entry
              role="listitem"
              tabIndex={item.tabIndex}
              user={item.item}
            />
          </ContainerListEntry>
        )}
      </VirtualContainer>
    </List>
  );
}

const EmptyState = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "32px 16px",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "14px",
    opacity: 0.7,
  },
});

const ContainerListEntry = styled("div", {
  base: {
    width: "100%",
  },
});

/**
 * Friend card row
 */
const FriendRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderRadius: "var(--borderRadius-md)",
    cursor: "pointer",
    transition: "background 0.15s, box-shadow 0.15s",
    userSelect: "none",

    "&:hover": {
      background: "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
    },

    "&:active": {
      background: "color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent)",
    },
  },
});

const FriendInfo = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
    gap: "1px",
  },
});

const FriendName = styled("span", {
  base: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

const FriendStatus = styled("span", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

const FriendActions = styled("div", {
  base: {
    display: "flex",
    gap: "4px",
    flexShrink: 0,
    opacity: 0,
    transition: "opacity 0.15s",

    "[data-friend-row]:hover &": {
      opacity: 1,
    },
  },
});

/**
 * Single user entry
 */
function Entry(props: { user: User; role?: string; tabIndex?: number }) {
  const { t } = useLingui();
  const { openModal } = useModals();
  const navigate = useNavigate();

  const statusText = () => {
    const custom = props.user.status?.text;
    if (custom) return custom;
    const presence = props.user.status?.presence ?? (props.user.online ? "Online" : undefined);
    if (!presence) return undefined;
    switch (presence) {
      case "Online": return t`Online`;
      case "Idle": return t`Idle`;
      case "Busy": return t`Do Not Disturb`;
      case "Focus": return t`Focus`;
      default: return undefined;
    }
  };

  return (
    <div
      data-friend-row
      use:floating={{
        contextMenu: () => <UserContextMenu user={props.user} />,
      }}
    >
      <FriendRow
        role={props.role}
        tabIndex={props.tabIndex}
        onClick={() => openModal({ type: "user_profile", user: props.user })}
      >
        <Avatar
          size={40}
          src={props.user.animatedAvatarURL}
          holepunch={
            props.user.relationship === "Friend" ? "bottom-right" : "none"
          }
          overlay={
            <Show when={props.user.relationship === "Friend"}>
              <UserStatus.Graphic
                status={props.user.status?.presence ?? "Online"}
              />
            </Show>
          }
        />
        <FriendInfo>
          <FriendName>{props.user.displayName}</FriendName>
          <Show when={statusText()}>
            <FriendStatus>{statusText()}</FriendStatus>
          </Show>
        </FriendInfo>
        <FriendActions>
          <Show when={props.user.relationship === "Friend"}>
            <IconButton
              size="xs"
              variant="standard"
              onPress={() =>
                props.user.openDM().then((ch) => navigate(ch.url))
              }
              use:floating={{
                tooltip: { placement: "top", content: t`Message` },
              }}
            >
              <Symbol size={18}>chat</Symbol>
            </IconButton>
          </Show>
          <IconButton
            size="xs"
            variant="standard"
            onPress={() =>
              openModal({ type: "user_profile", user: props.user })
            }
            use:floating={{
              tooltip: { placement: "top", content: t`Profile` },
            }}
          >
            <Symbol size={18}>person</Symbol>
          </IconButton>
        </FriendActions>
      </FriendRow>
    </div>
  );
}
