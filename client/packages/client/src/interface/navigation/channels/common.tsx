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
    borderTopLeftRadius: "var(--borderRadius-lg)",
    borderBottomLeftRadius: "var(--borderRadius-lg)",
    // borderRadius: "var(--borderRadius-lg)",
    // margin: "var(--gap-md) var(--gap-md) var(--gap-md) 0",
    width: "var(--layout-width-channel-sidebar)",

    fill: "var(--md-sys-color-on-surface)",
    color: "var(--md-sys-color-on-surface)",
    background: "linear-gradient(180deg, var(--md-sys-color-surface-container-low) 0%, color-mix(in srgb, var(--md-sys-color-surface-container) 60%, var(--md-sys-color-surface-container-low)) 100%)",
    borderRight: "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent)",
    boxShadow: "inset -1px 0 0 color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)",

    "& a": {
      textDecoration: "none",
    },
  },
});
