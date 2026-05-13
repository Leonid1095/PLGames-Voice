import { styled } from "styled-system/jsx";

/**
 * Common styles for sidebar
 */
export const SidebarBase = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    flexDirection: "column",
    overflow: "hidden",
    width: "var(--layout-width-channel-sidebar)",

    fill: "var(--md-sys-color-on-surface)",
    color: "var(--md-sys-color-on-surface)",
    /* Flat single surface — Notion/Linear feel. No gradient. */
    background: "var(--md-sys-color-surface-container-low)",
    borderRight: "1px solid var(--qp-border-subtle, rgba(255,255,255,0.06))",

    "& a": {
      textDecoration: "none",
    },
  },
});
