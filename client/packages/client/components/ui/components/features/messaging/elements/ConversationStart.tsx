import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { Symbol } from "../../../utils/Symbol";

interface Props {
  /**
   * Channel information
   */
  channel: Channel;
}

/**
 * Mark the beginning of a conversation.
 *
 * In a channel with history this is a quiet marker above the oldest message.
 * But in a brand-new channel it is the entire screen, and it used to render
 * as two lines of text in the bottom-left corner of a viewport of nothing —
 * the emptiest surface in the product exactly where a first impression is
 * formed. It now behaves like a proper welcome: the channel's own glyph on a
 * raised plate, the name at display size, and one line that tells you the
 * space is yours.
 */
export function ConversationStart(props: Props) {
  return (
    <Base>
      <Glyph>
        <Switch fallback={<Symbol size={28}>grid_3x3</Symbol>}>
          <Match when={props.channel.type === "SavedMessages"}>
            <Symbol size={28}>note_stack</Symbol>
          </Match>
          <Match when={props.channel.type === "DirectMessage"}>
            <Symbol size={28}>alternate_email</Symbol>
          </Match>
          <Match when={props.channel.isVoice}>
            <Symbol size={28}>headset_mic</Symbol>
          </Match>
          <Match when={props.channel.isForum}>
            <Symbol size={28}>forum</Symbol>
          </Match>
        </Switch>
      </Glyph>

      <Show when={props.channel.type !== "SavedMessages"}>
        <Name>{props.channel.name ?? props.channel.recipient?.username}</Name>
      </Show>

      <Lede>
        <Switch
          fallback={<Trans>This is the start of your conversation.</Trans>}
        >
          <Match when={props.channel.type === "SavedMessages"}>
            <Trans>This is the start of your notes.</Trans>
          </Match>
        </Switch>
      </Lede>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    display: "flex",
    userSelect: "none",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "10px",
    margin: "26px 16px 14px 16px",

    color: "var(--md-sys-color-on-surface)",

    animationName: "fadeSlideUp",
    animationDuration: "var(--pd-t-slow)",
    animationTimingFunction: "var(--pd-e-out)",
    animationFillMode: "both",
  },
});

/**
 * The channel's glyph on a raised plate — the same squircle language as the
 * server rail, so an empty screen still speaks the product's shapes.
 */
const Glyph = styled("div", {
  base: {
    width: "56px",
    height: "56px",
    display: "grid",
    placeItems: "center",

    borderRadius: "var(--pd-radius-squircle)",
    background: "var(--pd-surface-raised)",
    border: "1px solid var(--pd-border-subtle)",
    boxShadow: "var(--pd-shadow-raised)",
    color: "var(--md-sys-color-primary)",
    fill: "var(--md-sys-color-primary)",
  },
});

const Name = styled("span", {
  base: {
    fontFamily: "var(--pd-font-display)",
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
    fontWeight: 700,
    fontSize: "var(--pd-text-4xl)",
    lineHeight: "var(--pd-leading-tight)",
    letterSpacing: "0.005em",
    overflowWrap: "anywhere",
  },
});

const Lede = styled("span", {
  base: {
    fontSize: "var(--pd-text-md)",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});
