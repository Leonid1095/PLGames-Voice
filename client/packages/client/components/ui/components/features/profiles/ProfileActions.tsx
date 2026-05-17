import { Show } from "solid-js";
import { MoreVertical, Pencil, X } from "lucide-solid";

import { useNavigate } from "@solidjs/router";
import { ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useModals } from "@revolt/modal";

import { Button, IconButton } from "../../design";
import { dismissFloatingElements } from "../../floating";
import { iconSize } from "../../utils";

/**
 * Actions shown on profile cards
 */
export function ProfileActions(props: {
  width: 2 | 3;

  user: User;
  member?: ServerMember;
}) {
  const navigate = useNavigate();
  const { openModal } = useModals();

  /**
   * Open direct message channel
   */
  function openDm() {
    props.user.openDM().then((channel) => navigate(channel.url));
  }

  /**
   * Open edit menu
   */
  function openEdit() {
    if (props.member) {
      openModal({ type: "server_identity", member: props.member });
    } else {
      openModal({ type: "settings", config: "user" });
    }

    dismissFloatingElements();
  }

  return (
    <Actions width={props.width}>
      <Show when={props.user.relationship === "None" && !props.user.bot}>
        <Button onPress={() => props.user.addFriend()}>Add Friend</Button>
      </Show>
      <Show when={props.user.relationship === "Incoming"}>
        <Button onPress={() => props.user.addFriend()}>
          Accept friend request
        </Button>
        <IconButton onPress={() => props.user.removeFriend()}>
          <X />
        </IconButton>
      </Show>
      <Show when={props.user.relationship === "Outgoing"}>
        <Button onPress={() => props.user.removeFriend()}>
          Cancel friend request
        </Button>
      </Show>
      <Show when={props.user.relationship === "Friend"}>
        <Button onPress={openDm}>Message</Button>
      </Show>

      <Show
        when={
          props.member
            ? props.user.self
              ? props.member.server!.havePermission("ChangeNickname") ||
                props.member.server!.havePermission("ChangeAvatar")
              : (props.member.server!.havePermission("ManageNicknames") ||
                  props.member.server!.havePermission("RemoveAvatars")) &&
                props.member.inferiorTo(props.member!.server!.member!)
            : props.user.self
        }
      >
        <IconButton onPress={openEdit}>
          <Pencil {...iconSize(16)} />
        </IconButton>
      </Show>

      <IconButton
        use:floating={{
          contextMenu: () => (
            <UserContextMenu user={props.user} member={props.member} />
          ),
          contextMenuHandler: "click",
        }}
      >
        <MoreVertical />
      </IconButton>
    </Actions>
  );
}

const Actions = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    justifyContent: "flex-end",
  },
  variants: {
    width: {
      3: {
        gridColumn: "1 / 4",
      },
      2: {
        gridColumn: "1 / 3",
      },
    },
  },
});
