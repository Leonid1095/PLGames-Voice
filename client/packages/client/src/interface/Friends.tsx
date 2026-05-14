import {
  Accessor,
  For,
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
  Deferred,
  Header,
  IconButton,
  UserStatus,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { HeaderIcon } from "./common/CommonHeader";

/**
 * Friends menu
 */
export function Friends() {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  let scrollTargetElement!: HTMLDivElement;
  const targetSignal = () => scrollTargetElement;

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

  const pendingCount = () => {
    const n = lists().incoming.length + lists().outgoing.length;
    return n > 99 ? "99+" : n || "";
  };

  const [page, setPage] = createSignal("online");

  const tabs = [
    { id: "online", label: () => t`Online`, icon: "circle" },
    { id: "all", label: () => t`All`, icon: "group" },
    { id: "pending", label: () => t`Pending`, icon: "person_add" },
    { id: "blocked", label: () => t`Blocked`, icon: "block" },
  ];

  return (
    <Base>
      <Header placement="primary">
        <HeaderIcon>
          <Symbol>group</Symbol>
        </HeaderIcon>
        <Trans>Friends</Trans>
      </Header>

      <TabBar>
        <For each={tabs}>
          {(tab) => (
            <Tab
              active={page() === tab.id}
              onClick={() => setPage(tab.id)}
            >
              <Symbol size={18}>{tab.icon}</Symbol>
              <span>{tab.label()}</span>
              <Show when={tab.id === "pending" && pendingCount()}>
                <TabBadge>{pendingCount()}</TabBadge>
              </Show>
            </Tab>
          )}
        </For>

        <AddFriendButton
          onClick={() =>
            openModal({
              type: "add_friend",
              client: client(),
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Add a new friend`,
            },
          }}
        >
          <Symbol size={16}>person_add</Symbol>
          <Trans>Add friend</Trans>
        </AddFriendButton>
      </TabBar>

      <ContentArea ref={scrollTargetElement} use:scrollable>
        <Deferred>
          <Switch
            fallback={
              <People
                title={t`Online`}
                users={lists().online}
                scrollTargetElement={targetSignal}
                emptyIcon="person_off"
                emptyText={t`No friends online`}
              />
            }
          >
            <Match when={page() === "all"}>
              <People
                title={t`All Friends`}
                users={lists().friends}
                scrollTargetElement={targetSignal}
                emptyIcon="group_off"
                emptyText={t`You haven't added any friends yet`}
              />
            </Match>
            <Match when={page() === "pending"}>
              <Show when={lists().incoming.length > 0 || lists().outgoing.length === 0}>
                <People
                  title={t`Incoming`}
                  users={lists().incoming}
                  scrollTargetElement={targetSignal}
                  emptyIcon="hourglass_empty"
                  emptyText={t`No pending requests`}
                />
              </Show>
              <Show when={lists().outgoing.length > 0}>
                <People
                  title={t`Outgoing`}
                  users={lists().outgoing}
                  scrollTargetElement={targetSignal}
                  emptyIcon="hourglass_empty"
                  emptyText={t`No outgoing requests`}
                />
              </Show>
            </Match>
            <Match when={page() === "blocked"}>
              <People
                title={t`Blocked`}
                users={lists().blocked}
                scrollTargetElement={targetSignal}
                emptyIcon="block"
                emptyText={t`No blocked users`}
              />
            </Match>
          </Switch>
        </Deferred>
      </ContentArea>
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
  emptyIcon: string;
  emptyText: string;
}) {
  return (
    <>
      <SectionHeader>
        {props.title}
        <SectionCount>{props.users.length}</SectionCount>
      </SectionHeader>

      <Show when={props.users.length === 0}>
        <EmptyState>
          <Symbol size={48}>{props.emptyIcon}</Symbol>
          <EmptyText>{props.emptyText}</EmptyText>
        </EmptyState>
      </Show>

      <Show when={props.users.length > 0}>
        <VirtualContainer
          items={props.users}
          scrollTarget={props.scrollTargetElement()}
          itemSize={{ height: 56 }}
        >
          {(item) => (
            <div style={{ ...item.style, padding: "0 4px" }}>
              <Entry
                role="listitem"
                tabIndex={item.tabIndex}
                user={item.item}
              />
            </div>
          )}
        </VirtualContainer>
      </Show>
    </>
  );
}

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

  const presenceColor = () => {
    const p = props.user.status?.presence;
    if (p === "Busy") return "var(--md-sys-color-error)";
    if (p === "Idle") return "var(--md-sys-color-tertiary)";
    if (p === "Focus") return "var(--md-sys-color-primary)";
    return undefined;
  };

  return (
    <div
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
          size={36}
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
            <FriendStatus style={presenceColor() ? { color: presenceColor() } : {}}>
              {statusText()}
            </FriendStatus>
          </Show>
        </FriendInfo>
        <FriendActions data-actions>
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
          <Show when={props.user.relationship === "Incoming"}>
            <IconButton
              size="xs"
              variant="filled-tonal"
              onPress={() => props.user.addFriend()}
              use:floating={{
                tooltip: { placement: "top", content: t`Accept` },
              }}
            >
              <Symbol size={18}>check</Symbol>
            </IconButton>
            <IconButton
              size="xs"
              variant="standard"
              onPress={() => props.user.removeFriend()}
              use:floating={{
                tooltip: { placement: "top", content: t`Decline` },
              }}
            >
              <Symbol size={18}>close</Symbol>
            </IconButton>
          </Show>
          <Show when={props.user.relationship === "Outgoing"}>
            <IconButton
              size="xs"
              variant="standard"
              onPress={() => props.user.removeFriend()}
              use:floating={{
                tooltip: { placement: "top", content: t`Cancel` },
              }}
            >
              <Symbol size={18}>close</Symbol>
            </IconButton>
          </Show>
          <Show when={props.user.relationship === "Blocked"}>
            <IconButton
              size="xs"
              variant="standard"
              onPress={() => props.user.unblockUser()}
              use:floating={{
                tooltip: { placement: "top", content: t`Unblock` },
              }}
            >
              <Symbol size={18}>lock_open</Symbol>
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

// --- Styled Components ---

const Base = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
});

const TabBar = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "8px 16px",
    borderBottom: "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent)",
    flexShrink: 0,
  },
});

const Tab = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    fontFamily: "inherit",
    transition: "background 140ms cubic-bezier(0.2,0,0,1), color 140ms cubic-bezier(0.2,0,0,1), border-color 140ms cubic-bezier(0.2,0,0,1)",
    color: "var(--md-sys-color-on-surface-variant)",
    background: "transparent",
    whiteSpace: "nowrap",

    "&:hover": {
      background: "rgba(255,255,255,0.04)",
      color: "var(--md-sys-color-on-surface)",
    },
  },
  variants: {
    active: {
      true: {
        color: "var(--md-sys-color-on-surface)",
        background: "rgba(255,255,255,0.07)",
        borderColor: "var(--qp-border-subtle, rgba(255,255,255,0.06))",

        "&:hover": {
          background: "rgba(255,255,255,0.10)",
        },
      },
    },
  },
});

const TabBadge = styled("span", {
  base: {
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: 1,
    padding: "2px 5px",
    borderRadius: "var(--borderRadius-full)",
    background: "var(--md-sys-color-error)",
    color: "var(--md-sys-color-on-error)",
    minWidth: "16px",
    textAlign: "center",
  },
});

const AddFriendButton = styled("button", {
  base: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "10px",
    border: "1px solid color-mix(in srgb, white 12%, transparent)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    fontFamily: "inherit",
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
    transition: "background 180ms cubic-bezier(0.2,0,0,1), box-shadow 180ms cubic-bezier(0.2,0,0,1), transform 100ms cubic-bezier(0.2,0,0,1)",
    whiteSpace: "nowrap",

    "&:hover": {
      background: "color-mix(in srgb, var(--md-sys-color-primary) 92%, white)",
      boxShadow: "0 4px 16px var(--accent-glow, rgba(139,92,246,0.22)), inset 0 1px 0 rgba(255,255,255,0.18)",
    },
    "&:active": {
      transform: "scale(0.97)",
    },
  },
});

const ContentArea = styled("div", {
  base: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: "0 12px",
  },
});

const SectionHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "16px 8px 6px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
  },
});

const SectionCount = styled("span", {
  base: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--md-sys-color-outline)",
  },
});

const EmptyState = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "80px 16px",
    color: "var(--md-sys-color-on-surface-variant)",
    opacity: 0.5,
  },
});

const EmptyText = styled("span", {
  base: {
    fontSize: "14px",
    textAlign: "center",
  },
});

const FriendRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 140ms cubic-bezier(0.2,0,0,1)",
    userSelect: "none",

    "&:hover": {
      background: "rgba(255,255,255,0.04)",
    },

    "&:active": {
      background: "rgba(255,255,255,0.07)",
    },

    "&:hover [data-actions]": {
      opacity: 1,
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
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

const FriendStatus = styled("span", {
  base: {
    fontSize: "11px",
    color: "var(--md-sys-color-on-surface-variant)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

const FriendActions = styled("div", {
  base: {
    display: "flex",
    gap: "2px",
    flexShrink: 0,
    opacity: 0,
    transition: "opacity var(--transition-fast)",
  },
});
