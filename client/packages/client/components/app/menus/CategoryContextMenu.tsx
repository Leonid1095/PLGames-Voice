import { Show } from "solid-js";
import { Badge, FolderPlus, MessageSquareCheck, Pencil, Plus, Trash2 } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import type { API } from "stoat.js";
import { Channel, Server } from "stoat.js";

import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";

export type CategoryData = Omit<API.Category, "channels"> & {
  channels: Channel[];
};

/**
 * Context menu for categories
 */
export function CategoryContextMenu(props: {
  server: Server;
  category: CategoryData;
}) {
  const state = useState();
  const { openModal } = useModals();

  /**
   * Mark category as read
   */
  function markAsRead() {
    props.category.channels
      .filter((channel) => channel.unread)
      .forEach((channel) => channel.ack());
  }

  /**
   * Create a new category
   */
  function createCategory() {
    openModal({
      type: "create_category",
      server: props.server,
    });
  }

  /**
   * Delete category
   */
  function deleteCategory() {
    openModal({
      type: "delete_category",
      server: props.server,
      categoryId: props.category.id,
    });
  }

  function editCategoryName() {
    openModal({
      type: "edit_category",
      server: props.server,
      category: props.category,
    });
  }

  /**
   * Copy category id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.category.id);
  }

  /**
   * Determine if any channel in category has unread messages
   */
  const hasUnread = () => {
    return props.category.channels.some((channel) => channel?.unread);
  };

  return (
    <ContextMenu>
      <Show when={hasUnread()}>
        <ContextMenuButton icon={MessageSquareCheck} onClick={markAsRead}>
          <Trans>Mark as read</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
      </Show>

      <Show when={props.server.havePermission("ManageChannel")}>
        <ContextMenuButton
          icon={Plus}
          onClick={() =>
            openModal({
              type: "create_channel",
              server: props.server,
            })
          }
        >
          <Trans>Create channel</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={FolderPlus} onClick={createCategory}>
          <Trans>Create category</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.server.havePermission("ManageChannel")}>
        <ContextMenuButton
          icon={Pencil}
          onClick={editCategoryName}
        >
          <Trans>Rename category</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.server.havePermission("ManageChannel")}>
        <ContextMenuButton icon={Trash2} onClick={deleteCategory} destructive>
          <Trans>Delete category</Trans>
        </ContextMenuButton>
      </Show>

      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuDivider />
      </Show>

      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton icon={Badge} onClick={copyId}>
          <Trans>Copy category ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
