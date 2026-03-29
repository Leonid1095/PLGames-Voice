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

    color: "#F0ECF9",
    background: "radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(37,99,235,0.10) 0%, transparent 60%), #0C0A1A",

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
