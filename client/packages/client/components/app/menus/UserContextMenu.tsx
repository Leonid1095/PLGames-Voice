import { JSX, Match, Show, Switch } from "solid-js";
import { AtSign, Badge, BadgeCheck, Ban, Flag, MessageCircle, MicOff, MinusCircle, PlusCircle, Shield, Smile, X } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { useNavigate } from "@solidjs/router";
import { Channel, Message, ServerMember, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Slider, Text } from "@revolt/ui";

import MdChecked from "@material-symbols/svg-400/outlined/check_box.svg?component-solid";
import MdUnchecked from "@material-symbols/svg-400/outlined/check_box_outline_blank.svg?component-solid";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";
import { NotificationContextMenu } from "./shared/NotificationContextMenu";

/**
 * Context menu for users
 */
export function UserContextMenu(props: {
  user: User;
  channel?: Channel;
  member?: ServerMember;
  contextMessage?: Message;
  inVoice?: boolean;
}) {
  // TODO: if we take serverId instead, we could dynamically fetch server member here
  // same for the floating menu I guess?
  const state = useState();
  const client = useClient();
  const navigate = useNavigate();
  const { openModal } = useModals();

  // server context
  const params = useSmartParams();

  /**
   * Open direct message channel
   */
  function openDm() {
    props.user.openDM().then((channel) => navigate(channel.url));
  }

  /**
   * Delete channel
   */
  function closeDm() {
    openModal({
      type: "delete_channel",
      channel: props.channel!,
    });
  }

  /**
   * Mention the user
   */
  function mention() {
    if (!state.draft._setNodeReplacement) return;
    state.draft._setNodeReplacement([props.user.toString()]);
  }

  /**
   * Edit server identity for user
   */
  function editIdentity() {
    openModal({
      type: "server_identity",
      member: props.member!,
    });
  }

  /**
   * Report the user
   */
  function reportUser() {
    openModal({
      type: "report_content",
      target: props.user!,
      client: client(),
      contextMessage: props.contextMessage,
    });
  }

  /**
   * Edit this user's roles
   */
  function editRoles() {
    openModal({
      type: "user_profile_roles",
      member: props.member!,
    });
  }

  /**
   * Kick the member
   */
  function kickMember() {
    openModal({
      type: "kick_member",
      member: props.member!,
    });
  }

  /**
   * Ban the member
   */
  function banMember() {
    openModal({
      type: "ban_member",
      member: props.member!,
    });
  }

  /**
   * Ban the user
   */
  function banUser() {
    openModal({
      type: "ban_non_member",
      user: props.user!,
      server: client().servers.get(params().serverId!)!,
    });
  }

  /**
   * Add friend
   */
  function addFriend() {
    props.user.addFriend();
  }

  /**
   * Remove friend
   */
  function removeFriend() {
    props.user.removeFriend();
  }

  /**
   * Block user
   */
  function blockUser() {
    props.user.blockUser();
  }

  /**
   * Unblock user
   */
  function unblockUser() {
    props.user.unblockUser();
  }

  /**
   * Open user in PLG Voice Admin Panel
   */
  function openAdminPanel() {
    window.open(
      `https://admin.plgames-voice.ru/panel/inspect/user/${props.user.id}`,
      "_blank",
    );
  }

  /**
   * Copy user id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.user.id);
  }

  return (
    <ContextMenu class="UserContextMenu">
      <Show when={props.inVoice && !props.user.self}>
        <ContextMenuButton
          onMouseDown={(e) => e.stopImmediatePropagation()}
          onClick={(e) => e.stopImmediatePropagation()}
        >
          <Text class="label">
            <Trans>Volume</Trans>
          </Text>
          <Slider
            min={0}
            max={3}
            step={0.1}
            value={state.voice.getUserVolume(props.user.id)}
            onInput={(event) =>
              state.voice.setUserVolume(
                props.user.id,
                event.currentTarget.value,
              )
            }
            labelFormatter={(label) => (label * 100).toFixed(0) + "%"}
          />
        </ContextMenuButton>
        <ContextMenuButton
          icon={MicOff}
          onClick={() =>
            state.voice.setUserMuted(
              props.user.id,
              !state.voice.getUserMuted(props.user.id),
            )
          }
          actionSymbol={
            state.voice.getUserMuted(props.user.id) ? MdChecked : MdUnchecked
          }
        >
          <Trans>Mute</Trans>
        </ContextMenuButton>

        <ContextMenuDivider />
      </Show>

      <Show when={props.channel?.type === "DirectMessage"}>
        <ContextMenuButton icon={X} onClick={closeDm}>
          <Trans>Close chat</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.channel?.type === "TextChannel"}>
        <ContextMenuButton icon={AtSign} onClick={mention}>
          <Trans>Mention</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.user.relationship === "Friend"}>
        <ContextMenuButton icon={MessageCircle} onClick={openDm}>
          <Trans>Message</Trans>
        </ContextMenuButton>
      </Show>

      <Show
        when={
          props.user.relationship === "Friend" ||
          (props.channel &&
            (props.channel.type === "DirectMessage" ||
              props.channel.type === "TextChannel"))
        }
      >
        <ContextMenuDivider />
      </Show>

      <Show when={props.channel?.type === "DirectMessage"}>
        <NotificationContextMenu channel={props.channel!} />
        <ContextMenuDivider />
      </Show>

      <Show
        when={
          props.member &&
          (props.user.self
            ? props.member!.server!.havePermission("ChangeNickname") ||
              props.member!.server!.havePermission("ChangeAvatar")
            : (props.member!.server!.havePermission("ManageNicknames") ||
                props.member!.server!.havePermission("RemoveAvatars")) &&
              props.member!.inferiorTo(props.member!.server!.member!))
        }
      >
        <ContextMenuButton icon={Smile} onClick={editIdentity}>
          <Switch fallback={<Trans>Edit identity</Trans>}>
            <Match when={props.user.self}>
              <Trans>Edit your identity</Trans>
            </Match>
          </Switch>
        </ContextMenuButton>
      </Show>

      <Show when={props.member}>
        <Show
          when={
            props.member?.server?.owner?.self ||
            (props.member?.server?.havePermission("AssignRoles") &&
              props.member.inferiorTo(props.member.server.member!))
          }
        >
          <ContextMenuButton icon={BadgeCheck} onClick={editRoles}>
            <Trans>Edit roles</Trans>
          </ContextMenuButton>
        </Show>
        {/** TODO: #287 timeout users */}
        <Show
          when={
            !props.user.self &&
            props.member?.server?.havePermission("KickMembers") &&
            props.member.inferiorTo(props.member.server.member!)
          }
        >
          <ContextMenuButton
            icon={MdPersonRemove}
            onClick={kickMember}
            destructive
          >
            <Trans>Kick member</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            !props.user.self &&
            props.member?.server?.havePermission("BanMembers") &&
            props.member.inferiorTo(props.member.server.member!)
          }
        >
          <ContextMenuButton
            icon={MinusCircle}
            onClick={banMember}
            destructive
          >
            <Trans>Ban member</Trans>
          </ContextMenuButton>
        </Show>
      </Show>

      <Show
        when={
          !props.user.self &&
          props.member?.server?.havePermission("BanMembers") &&
          params().serverId &&
          !props.member
        }
      >
        <ContextMenuButton
          icon={MinusCircle}
          onClick={banUser}
          destructive
        >
          <Trans>Ban user</Trans>
        </ContextMenuButton>
      </Show>

      <Show when={!props.user.self}>
        <ContextMenuButton icon={Flag} onClick={reportUser} destructive>
          <Trans>Report user</Trans>
        </ContextMenuButton>
        {/* TODO: #286 show profile / message */}
        <Show when={props.user.relationship === "None" && !props.user.bot}>
          <ContextMenuButton icon={MdPersonAddAlt} onClick={addFriend}>
            <Trans>Add friend</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Friend"}>
          <ContextMenuButton icon={MdPersonRemove} onClick={removeFriend}>
            <Trans>Remove friend</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Incoming"}>
          <ContextMenuButton icon={MdPersonAddAlt} onClick={addFriend}>
            <Trans>Accept friend request</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Incoming"}>
          <ContextMenuButton icon={X} onClick={removeFriend}>
            <Trans>Reject friend request</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Outgoing"}>
          <ContextMenuButton icon={X} onClick={removeFriend}>
            <Trans>Cancel friend request</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship !== "Blocked"}>
          <ContextMenuButton icon={Ban} onClick={blockUser}>
            <Trans>Block user</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Blocked"}>
          <ContextMenuButton icon={PlusCircle} onClick={unblockUser}>
            <Trans>Unblock user</Trans>
          </ContextMenuButton>
        </Show>
      </Show>

      <Show
        when={
          state.settings.getValue("advanced:admin_panel") ||
          state.settings.getValue("advanced:copy_id")
        }
      >
        <ContextMenuDivider />
      </Show>

      <Show when={state.settings.getValue("advanced:admin_panel")}>
        <ContextMenuButton icon={Shield} onClick={openAdminPanel}>
          <Trans>Admin Panel</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton icon={Badge} onClick={copyId}>
          <Trans>Copy user ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}

/**
 * Provide floating user menus on this element
 * @param user User
 * @param member Server Member
 */
export function floatingUserMenus(
  user: User,
  member?: ServerMember,
  contextMessage?: Message,
): JSX.Directives["floating"] & object {
  return {
    userCard: {
      user,
      member,
      // we could use message to display masquerade info in user card
    },
    /**
     * Build user context menu
     */
    contextMenu() {
      return (
        <UserContextMenu
          user={user}
          member={member}
          contextMessage={contextMessage}
          channel={contextMessage?.channel}
        />
      );
    },
  };
}

export function floatingUserMenusFromMessage(message: Message) {
  return message.author
    ? floatingUserMenus(message.author!, message.member, message)
    : {}; // TODO: webhook menu
}
