import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { Text } from "../../../design";

interface Props {
  /**
   * Channel information
   */
  channel: Channel;
}

/**
 * Mark the beginning of a conversation
 */
export function ConversationStart(props: Props) {
  return (
    <Base>
      <Show when={props.channel.type !== "SavedMessages"}>
        <Text class="title" size="large">
          {props.channel.name ?? props.channel.recipient?.username}
        </Text>
      </Show>
      <Text class="body">
        <Switch
          fallback={<Trans>This is the start of your conversation.</Trans>}
        >
          <Match when={props.channel.type === "SavedMessages"}>
            <Trans>This is the start of your notes.</Trans>
          </Match>
        </Switch>
      </Text>
    </Base>
  );
}

/**
 * Base styles
 */
const Base = styled("div", {
  base: {
    display: "flex",
    userSelect: "none",
    flexDirection: "column",
    gap: "2px",
    margin: "18px 16px 10px 16px",

    /*
     * `headline large` plus `title` was fine when both were the body face at
     * weight 400. Once title/headline moved onto the condensed display face at
     * 700, this block became a 34px slab with a bold second line under it. The
     * name keeps a display treatment at title size; the sentence below it is
     * body text, because that is what it is.
     */
    color: "var(--md-sys-color-on-surface)",
    "& > *:last-child": {
      color: "var(--md-sys-color-on-surface-variant)",
    },
  },
});
