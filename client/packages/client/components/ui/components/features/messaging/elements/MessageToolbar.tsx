import { Show } from "solid-js";

import { Message } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { useLingui } from "@lingui-solid/solid/macro";

import { MessageContextMenu } from "@revolt/app";
import { useUser } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Ripple } from "@revolt/ui/components/design";
import { iconSize } from "@revolt/ui/components/utils";

import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdEdit from "@material-design-icons/svg/outlined/edit.svg?component-solid";
import MdEmojiEmotions from "@material-design-icons/svg/outlined/emoji_emotions.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/outlined/more_vert.svg?component-solid";
import MdReply from "@material-design-icons/svg/outlined/reply.svg?component-solid";

import { startsWithPackPUA } from "@revolt/markdown/emoji/UnicodeEmoji";
import { CompositionMediaPicker } from "../composition";

export function MessageToolbar(props: { message?: Message }) {
  const { t } = useLingui();
  const user = useUser();
  const state = useState();
  const { openModal } = useModals();

  /**
   * Delete the message
   */
  function deleteMessage(ev: MouseEvent) {
    if (ev.shiftKey) {
      props.message?.delete();
    } else if (props.message) {
      openModal({
        type: "delete_message",
        message: props.message,
      });
    }
  }

  return (
    <Base class="Toolbar">
      <Show when={props.message?.channel?.havePermission("SendMessage")}>
        <button
          class={tool()}
          aria-label={t`Ответить`}
          onClick={() => state.draft.addReply(props.message!, user()!.id)}
        >
          <Ripple />
          <MdReply {...iconSize(20)} />
        </button>
      </Show>
      <Show when={props.message?.channel?.havePermission("React")}>
        <CompositionMediaPicker
          onMessage={(content) =>
            props.message?.channel?.sendMessage({
              content,
              replies: [{ id: props.message.id, mention: true }],
            })
          }
          onTextReplacement={(emoji) =>
            props.message!.react(
              emoji.startsWith(":")
                ? emoji.slice(1, emoji.length - 1)
                : startsWithPackPUA(emoji)
                  ? emoji.slice(1)
                  : emoji,
            )
          }
        >
          {(triggerProps) => (
            <button
              ref={triggerProps.ref}
              class={tool()}
              aria-label={t`Реакция`}
              onClick={triggerProps.onClickEmoji}
            >
              <Ripple />
              <MdEmojiEmotions {...iconSize(20)} />
            </button>
          )}
        </CompositionMediaPicker>
      </Show>
      <Show when={props.message?.author?.self}>
        <button
          class={tool()}
          aria-label={t`Редактировать`}
          onClick={() => state.draft.setEditingMessage(props.message)}
        >
          <Ripple />
          <MdEdit {...iconSize(20)} />
        </button>
      </Show>
      <Show
        when={
          props.message?.author?.self ||
          props.message?.channel?.havePermission("ManageMessages")
        }
      >
        <button class={tool()} aria-label={t`Удалить`} onClick={deleteMessage}>
          <Ripple />
          <MdDelete {...iconSize(20)} />
        </button>
      </Show>
      <button
        class={tool()}
        aria-label={t`Ещё`}
        use:floating={{
          contextMenu: () => <MessageContextMenu message={props.message!} />,
          contextMenuHandler: "click",
        }}
      >
        <Ripple />
        <MdMoreVert {...iconSize(20)} />
      </button>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    top: "-14px",
    right: "8px",
    position: "absolute",

    alignItems: "center",

    display: "none",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-sm)",
    boxShadow: "var(--elevation-2)",
    border: "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent)",

    fill: "var(--md-sys-color-on-secondary-container)",
    background: "var(--md-sys-color-secondary-container)",

    animation: "popIn 0.15s ease-out",
  },
});

const tool = cva({
  base: {
    cursor: "pointer",
    position: "relative",
    padding: "var(--gap-sm)",
    border: "none",
    background: "transparent",
    color: "inherit",
    fill: "inherit",
    font: "inherit",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  },
});
