import { JSX, Show, splitProps } from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { Ripple } from "./Ripple";
import { Unreads } from "./Unreads";

export type Props = {
  /**
   * Button size
   * @default thin
   */
  readonly size?: "thin" | "normal";

  /**
   * Button attention
   * @default normal
   */
  readonly attention?: "muted" | "normal" | "active" | "selected";

  /**
   * Button icon
   */
  readonly icon?: JSX.Element;

  /**
   * Button content
   */
  readonly children?: JSX.Element;

  /**
   * Alert indicator
   */
  readonly alert?: number | boolean;

  /**
   * Hover actions
   */
  readonly actions?: JSX.Element;
};

/**
 * Button intended for sidebar contexts
 */
export function MenuButton(props: Props & JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, other] = splitProps(props, [
    "attention",
    "size",
    "icon",
    "children",
    "alert",
    "actions",
  ]);

  return (
    // TODO: port to panda-css to merge down components
    <div
      {...other}
      classList={{
        [base({
          attention: local.attention,
          size: local.size,
        })]: true,
      }}
      // @codegen directives props=other include=floating
    >
      <Ripple />
      {/* <Base {...other} align> */}
      {local.icon}
      <Content>{local.children}</Content>
      <Show when={local.alert}>
        <span class="hover-hide">
          <Unreads
            count={typeof local.alert === "number" ? local.alert : 0}
            size={typeof local.alert === "number" ? "0.85rem" : "0.4rem"}
            unread
          />
        </span>
      </Show>
      {local.actions && (
        <Actions class="hover-show" onClick={(e) => e.stopPropagation()}>
          {local.actions}
        </Actions>
      )}
      {/* </Base> */}
    </div>
  );
}

/**
 * Top-level container
 */
const base = cva({
  base: {
    flexShrink: 0,

    fontWeight: 500,
    fontSize: "14px",
    letterSpacing: "-0.005em",
    userSelect: "none",
    cursor: "pointer",

    // for <Ripple />:
    position: "relative",

    display: "flex",
    alignItems: "center",
    margin: "0 8px",
    padding: "0 10px",
    borderRadius: "6px",

    color: "var(--color)",
    fill: "var(--color)",
    transition: "background-color 140ms cubic-bezier(0.2,0,0,1), color 140ms cubic-bezier(0.2,0,0,1)",

    "& > svg": {
      alignSelf: "center",
    },

    // swap `.hover-hide` elements w/  `.hover-show` elements on hover
    "&:hover .hover-hide, &:not(:hover) .hover-show": {
      display: "none",
    },
  },
  variants: {
    size: {
      normal: {
        height: "32px",
        gap: "8px",
      },
      thin: {
        height: "28px",
        gap: "6px",

        // implicitly align center since we won't stack anything
        alignItems: "center",
      },
    },
    attention: {
      normal: {
        "--color": "var(--md-sys-color-on-surface-variant)",
        background: "transparent",
        "&:hover": {
          background: "rgba(255,255,255,0.04)",
          "--color": "var(--md-sys-color-on-surface)",
        },
      },
      muted: {
        "--color": "color-mix(in srgb, var(--md-sys-color-on-surface) 40%, transparent)",
        background: "transparent",

        "& img": {
          opacity: "0.4",
        },
        "&:hover": {
          background: "rgba(255,255,255,0.03)",
        },
      },
      active: {
        /* Channel has unread — slightly emphasized text, still no background */
        "--color": "var(--md-sys-color-on-surface)",
        background: "transparent",
        fontWeight: "500",
        "&:hover": {
          background: "rgba(255,255,255,0.04)",
        },
      },
      selected: {
        /* Active route — subtle neutral surface, not bright accent. */
        "--color": "var(--md-sys-color-on-surface)",
        background: "rgba(255,255,255,0.07)",
        "&:hover": {
          background: "rgba(255,255,255,0.10)",
        },
      },
    },
  },
  defaultVariants: {
    size: "normal",
    attention: "normal",
  },
});

/**
 * Textual content
 */
const Content = styled("div", {
  base: {
    flexGrow: 1,
    minWidth: 0,
  },
});

/**
 * Right-side actions
 */
const Actions = styled("div", {
  base: {
    alignSelf: "center",

    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    gap: "var(--gap-sm)",
  },
});
