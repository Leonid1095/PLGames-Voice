import { Match, Switch, splitProps } from "solid-js";

import { Message as MessageInterface } from "stoat.js";
import { styled } from "styled-system/jsx";

import { BlockedMessage, MessageDivider } from "@revolt/ui";

import { Message } from "./Message";

import type { Accessor } from "solid-js";

/**
 * List entries
 */
export type ListEntry =
  | {
      // Message
      t: 0;
      message: MessageInterface;
      tail: boolean;
      highlight: boolean;
    }
  | {
      // Message Divider
      t: 1;
      date?: string;
      unread?: boolean;
    }
  | {
      // Blocked messages
      t: 2;
      count: number;
    };

/**
 * Render individual list entry
 */
export function Entry(
  props: ListEntry & {
    highlightedMessageId: Accessor<string | undefined>;
    editingMessageId?: string;
  },
) {
  const [local, other] = splitProps(props, [
    "t",
    "highlightedMessageId",
    "editingMessageId",
  ]);

  return (
    <Switch>
      <Match when={local.t === 0}>
        <Message
          {...(other as ListEntry & { t: 0 })}
          highlight={
            (other as ListEntry & { t: 0 }).message.id ===
            local.highlightedMessageId()
          }
          editing={
            (other as ListEntry & { t: 0 }).message.id ===
            local.editingMessageId
          }
        />
      </Match>
      <Match when={local.t === 1}>
        <MessageDivider {...(other as ListEntry & { t: 1 })} />
      </Match>
      <Match when={local.t === 2}>
        <BlockedMessage count={(other as ListEntry & { t: 2 }).count} />
      </Match>
    </Switch>
  );
}

/**
 * Anchor to the end of the messages list
 */
export const AnchorToEnd = styled("div", {
  base: {
    zIndex: 30,
    position: "relative",

    "& > div": {
      width: "100%",
      position: "absolute",
      bottom: "var(--gap-md)",
    },
  },
});

/**
 * Container padding
 */
export const Padding = styled("div", {
  base: {
    height: "24px",
  },
});
