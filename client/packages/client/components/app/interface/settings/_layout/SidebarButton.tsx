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
    borderRadius: "var(--pd-radius-sm)",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    marginInlineEnd: "8px",
    fontSize: "14px",
    userSelect: "none",
    transition: "background-color var(--pd-transition-fast), color var(--pd-transition-fast)",
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
        // The raised plate with an accent rail, matching the active channel
        // row and the active Friends tab.
        background: "var(--pd-surface-raised)",
        boxShadow: "var(--pd-shadow-raised)",
        color: "var(--md-sys-color-on-surface)",
        fill: "var(--md-sys-color-on-surface)",
        fontWeight: "var(--pd-weight-semibold)",

        "&::before": {
          content: '""',
          position: "absolute",
          insetInlineStart: "0",
          top: "50%",
          width: "3px",
          height: "16px",
          translate: "0 -50%",
          borderRadius: "0 var(--pd-radius-xs) var(--pd-radius-xs) 0",
          background: "var(--md-sys-color-primary)",
        },

        "&:hover": {
          background: "var(--pd-surface-raised)",
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
