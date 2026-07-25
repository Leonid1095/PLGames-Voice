import { styled } from "styled-system/jsx";

/**
 * Sidebar button
 */
export const SidebarButton = styled("a", {
  base: {
    // for <Ripple />:
    position: "relative",

    minWidth: 0,

    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    marginInlineEnd: "8px",
    fontSize: "14px",
    userSelect: "none",
    transition: "background-color 140ms cubic-bezier(0.2,0,0,1), color 140ms cubic-bezier(0.2,0,0,1)",
    color: "var(--md-sys-color-on-surface-variant)",
    fill: "var(--md-sys-color-on-surface-variant)",
    background: "transparent",

    "&:hover": {
      background: "var(--pd-tint-subtle)",
      color: "var(--md-sys-color-on-surface)",
      fill: "var(--md-sys-color-on-surface)",
    },

    "& svg": {
      flexShrink: 0,
    },
  },
  variants: {
    "aria-selected": {
      true: {
        background: "var(--pd-tint-hover)",
        color: "var(--md-sys-color-on-surface)",
        fill: "var(--md-sys-color-on-surface)",
        "&:hover": {
          background: "var(--pd-tint-active)",
        },
      },
    },
  },
});

export const SidebarButtonTitle = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexGrow: 1,
    minWidth: 0,
    paddingInlineEnd: "8px",
  },
});

export const SidebarButtonContent = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
});

export const SidebarButtonIcon = styled("div", {
  base: {
    display: "flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexShrink: 0,
    gap: "2px",
  },
});
