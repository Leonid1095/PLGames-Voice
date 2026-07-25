import { Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

/**
 * Divider line
 */
const Base = styled("div", {
  base: {
    height: 0,
    display: "flex",
    userSelect: "none",
    alignItems: "center",
    margin: "17px 12px 17px 8px",

    // Date sits on the line as a mono label, same treatment as sidebar
    // categories and every other caption in the app.
    "& time": {
      marginTop: "-2px",
      paddingInline: "6px",

      fontFamily: "var(--pd-font-mono)",
      fontSize: "var(--pd-text-xs)",
      lineHeight: "1",
      letterSpacing: "var(--pd-tracking-label)",
      textTransform: "uppercase",

      color: "var(--md-sys-color-on-surface-variant)",
      background: "var(--md-sys-color-surface)",
    },
  },
  variants: {
    unread: {
      true: {
        // Accent, not error. The brand signal is already red; a second,
        // slightly different red for "you have not read this" reads as a
        // fault condition rather than a bookmark.
        borderTop: "1px solid var(--md-sys-color-primary)",
      },
      false: {
        borderTop: "thin solid var(--md-sys-color-outline-variant)",
      },
    },
  },
  defaultVariants: {
    unread: false,
  },
});

/**
 * Unread indicator
 */
const Unread = styled("div", {
  base: {
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    lineHeight: "1",
    letterSpacing: "var(--pd-tracking-label)",
    textTransform: "uppercase",

    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",

    padding: "3px 7px 3px 8px",
    marginTop: "-1px",
    borderRadius: "var(--pd-radius-pill)",
  },
});

interface Props {
  /**
   * Display the date
   */
  date?: string;

  /**
   * Show unread indicator
   */
  unread?: boolean;
}

/**
 * Generic message divider
 */
export function MessageDivider(props: Props) {
  return (
    <Base unread={props.unread}>
      <Show when={props.unread}>
        <Unread>
          <Trans>NEW</Trans>
        </Unread>
      </Show>
      <Show when={props.date}>
        <time>{props.date}</time>
      </Show>
    </Base>
  );
}
