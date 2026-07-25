import { JSXElement } from "solid-js";

import { cva } from "styled-system/css";

/**
 * Lists are continuous, vertical indexes of text and images.
 *
 * Native list elements rather than MDUI web components, so screen readers get
 * real list semantics ("list, 5 items") instead of a custom element they have
 * to be told about.
 */
export function List(props: { children: JSXElement }) {
  return <ul class={list()}>{props.children}</ul>;
}

const list = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
});

/**
 * A subheader used in a list.
 *
 * Carries the Полдень label treatment — mono, uppercase, wide tracking — which
 * is the same styling category names use in the channel sidebar.
 */
function ListSubheader(props: { children: JSXElement }) {
  return <li class={`pd-label ${subheader()}`}>{props.children}</li>;
}

List.Subheader = ListSubheader;

const subheader = cva({
  base: {
    padding: "var(--pd-space-4) var(--pd-space-3) var(--pd-space-2)",
  },
});

/**
 * An item that appears in a list.
 *
 * Renders as a button when it has an onClick, and as a plain row otherwise —
 * a clickable row that is not a button cannot be reached by keyboard.
 */
function ListItem(props: {
  children: JSXElement;
  rounded?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      {props.onClick ? (
        <button
          type="button"
          class={listitem({ interactive: true, rounded: props.rounded })}
          disabled={props.disabled}
          onClick={() => props.onClick?.()}
        >
          {props.children}
        </button>
      ) : (
        <div class={listitem({ rounded: props.rounded })}>{props.children}</div>
      )}
    </li>
  );
}

List.Item = ListItem;

const listitem = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--pd-space-2)",
    width: "100%",
    minHeight: "36px",
    padding: "var(--pd-space-1) var(--pd-space-3)",
    border: "none",
    background: "transparent",
    color: "var(--md-sys-color-on-surface)",
    font: "inherit",
    fontSize: "var(--pd-text-base)",
    textAlign: "start",
  },
  variants: {
    interactive: {
      true: {
        cursor: "pointer",
        transition: "background var(--pd-transition-fast)",
        "&:hover:not(:disabled)": {
          background: "var(--md-sys-color-surface-container-high)",
        },
        "&:disabled": { opacity: 0.5, cursor: "default" },
      },
    },
    rounded: {
      true: { borderRadius: "var(--pd-radius-pill)" },
      false: { borderRadius: "var(--pd-radius-sm)" },
    },
  },
  defaultVariants: { rounded: false },
});
