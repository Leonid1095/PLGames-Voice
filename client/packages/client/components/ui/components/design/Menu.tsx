import type { JSX } from "solid-js";

import { css } from "styled-system/css";

/**
 * Single item that appears in a menu.
 *
 * Native button rather than an MDUI web component, so the row can be styled
 * directly instead of through custom properties reaching into a closed shadow
 * DOM. Keyboard activation and focus order come from the element itself.
 */
export function MenuItem(
  props: JSX.HTMLAttributes<HTMLButtonElement> & {
    value?: string;
    disabled?: boolean;
  },
) {
  return (
    <button
      type="button"
      role="menuitem"
      {...props}
      class={`${item()} ${props.class ?? ""}`}
    />
  );
}

const item = () =>
  css({
    display: "flex",
    alignItems: "center",
    gap: "var(--pd-space-2)",
    width: "100%",
    // Touch target floor from the a11y pass; the visual row stays compact.
    minHeight: "36px",
    padding: "0 var(--pd-space-3)",
    border: "none",
    background: "transparent",
    color: "var(--md-sys-color-on-surface)",
    font: "inherit",
    fontSize: "var(--pd-text-base)",
    textAlign: "start",
    borderRadius: "var(--pd-radius-sm)",
    cursor: "pointer",
    transition: "background var(--pd-transition-fast)",

    "&:hover:not(:disabled)": {
      background: "var(--md-sys-color-surface-container-high)",
    },
    "&:active:not(:disabled)": { transform: "scale(0.99)" },
    "&:disabled": { opacity: 0.5, cursor: "default" },
  });
