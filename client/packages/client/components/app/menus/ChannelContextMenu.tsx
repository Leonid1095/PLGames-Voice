import { Match, Show, Switch } from "solid-js";
import { Badge, FolderPlus, LogOut, MessageSquareCheck, Settings, Share2, Trash2, UserPlus } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";

import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";
import { NotificationContextMenu } from "./shared/NotificationContextMenu";

/**
 * Context menu for channels
 */
export function ChannelContextMenu(props: { channel: Channel }) {
  const state = useState();
  const { openModal } = useModals();

  /**
   * Mark channel as read
   */
  function markAsRead() {
    props.channel.ack();
  }

  /**
   * Create a new invite
   */
  function createInvite() {
    openModal({
      type: "create_invite",
      channel: props.channel,
    });
  }

  /**
   * Create a new channel
   */
  function createChannel() {
    openModal({
      type: "create_channel",
      server: props.channel.server!,
    });
  }

  /**
   * Edit channel
   */
  function editChannel() {
    openModal({
      type: "settings",
      config: "channel",
      context: props.channel,
    });
  }

  /**
   * Delete channel
   */
  function deleteChannel() {
    openModal({
      type: "delete_channel",
      channel: props.channel,
    });
  }

  /**
   * Copy channel link to clipboard
   */
  function copyLink() {
    navigator.clipboard.writeText(
      `${location.origin}${
        props.channel.server ? `/server/${props.channel.server?.id}` : ""
      }/channel/${props.channel.id}`,
    );
  }

  /**
   * Copy channel id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.channel.id);
  }

  return (
    <ContextMenu>
      <Show
        when={
          props.channel.unread || props.channel.havePermission("InviteOthers")
        }
      >
        <Show when={props.channel.unread}>
          <ContextMenuButton icon={MessageSquareCheck} onClick={markAsRead}>
            <Trans>Mark as read</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.channel.havePermission("InviteOthers")}>
          <ContextMenuButton icon={UserPlus} onClick={createInvite}>
            <Trans>Create invite</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuDivider />
      </Show>

      <NotificationContextMenu channel={props.channel} />

      <ContextMenuDivider />

      <Show when={props.channel.server?.havePermission("ManageChannel")}>
        <ContextMenuButton icon={FolderPlus} onClick={createChannel}>
          <Trans>Create channel</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.channel.havePermission("ManageChannel")}>
        <ContextMenuButton icon={Settings} onClick={editChannel}>
          <Trans>Open channel settings</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={props.channel.type === "Group" ? LogOut : Trash2}
          onClick={deleteChannel}
          destructive
        >
          <Switch fallback={<Trans>Delete channel</Trans>}>
            <Match when={props.channel.type === "Group"}>
              <Trans>Leave group</Trans>
            </Match>
          </Switch>
        </ContextMenuButton>
      </Show>

      <Show
        when={
          props.channel.server?.havePermission("ManageChannel") ||
          props.channel.havePermission("ManageChannel")
        }
      >
        <ContextMenuDivider />
      </Show>

      <ContextMenuButton icon={Share2} onClick={copyLink}>
        <Trans>Copy link</Trans>
      </ContextMenuButton>
      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton icon={Badge} onClick={copyId}>
          <Trans>Copy channel ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
