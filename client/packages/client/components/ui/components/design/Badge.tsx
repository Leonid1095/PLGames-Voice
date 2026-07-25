import { JSXElement } from "solid-js";

import { cva } from "styled-system/css";

interface Props {
  slot?: string;
  children: JSXElement;
  variant?: "small" | "large";
}

/**
 * Badges show notifications, counts, or status information on navigation items
 * and icons.
 *
 * Native span rather than an MDUI web component. The `variant` prop was
 * previously accepted and then ignored — MDUI took its size from its own slot
 * — so it now actually does something: "small" is the bare dot used when the
 * count does not matter, "large" carries a number.
 *
 * Counts are tabular so a badge does not change width between 8 and 9.
 */
export function Badge(props: Props) {
  return (
    <span slot={props.slot ?? "badge"} class={badge({ variant: props.variant ?? "large" })}>
      {props.children}
    </span>
  );
}

const badge = cva({
  base: {
    display: "inline-grid",
    placeItems: "center",
    flex: "none",
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
    fontFamily: "var(--pd-font-mono)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    borderRadius: "var(--pd-radius-pill)",
  },
  variants: {
    variant: {
      small: {
        width: "8px",
        height: "8px",
        padding: 0,
      },
      large: {
        minWidth: "18px",
        height: "18px",
        padding: "0 var(--pd-space-1)",
        fontSize: "var(--pd-text-xs)",
      },
    },
  },
});
