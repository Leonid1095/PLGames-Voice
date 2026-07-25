import { JSX } from "solid-js";

import { styled } from "styled-system/jsx";

import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";

/**
 * Authentication page layout
 *
 * Literal light values rather than --md-sys-color-*: nobody is logged in yet,
 * so there is no theme to read. These match the landing, which is the screen
 * the visitor just came from.
 */
const Base = styled("div", {
  base: {
    width: "100%",
    height: "100%",

    userSelect: "none",
    overflowY: "auto",

    color: "#16131C",
    /* One accent wash, same as the landing. The blue and pink radials that
       used to sit on top of it were colours the product does not use. */
    background: `
      radial-gradient(ellipse 90% 55% at 50% -12%, rgba(224,10,69,0.13) 0%, transparent 62%),
      #FBF9F7
    `,
    fontFamily: "var(--pd-font-sans)",
    letterSpacing: "var(--pd-tracking-snug)",

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
