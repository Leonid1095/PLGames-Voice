import { JSX } from "solid-js";

import { styled } from "styled-system/jsx";

import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";

/**
 * Authentication page layout — Obsidian Amethyst
 */
const Base = styled("div", {
  base: {
    width: "100%",
    height: "100%",

    userSelect: "none",
    overflowY: "auto",

    color: "#F5F5F7",
    /* Same Quiet Pro mesh as Landing — restrained accent + neutral base */
    background: `
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 90% 30%, rgba(56,189,248,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 10% 80%, rgba(244,114,182,0.04) 0%, transparent 60%),
      #0B0A12
    `,
    fontFamily: "var(--qp-font-sans)",
    letterSpacing: "var(--qp-tracking-snug)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Authentication page
 */
export function AuthPage(props: { children: JSX.Element }) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        height: "100%",
      }}
    >
      <Titlebar />
      <Base>{props.children}</Base>
    </div>
  );
}
