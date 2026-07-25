import { JSX, Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { Column, Text } from "@revolt/ui";

/**
 * Container for authentication page flows — the card on the auth page
 *
 * Literal light values for the same reason as AuthPage: no user, no theme.
 */
export const FlowBase = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flexGrow: 0,

    background: "#FFFFFF",
    color: "#16131C",

    width: "440px",
    maxWidth: "calc(100vw - 40px)",
    padding: "32px",
    borderRadius: "var(--pd-radius-xl)",
    border: "1px solid rgba(22,19,28,0.12)",
    boxShadow: "var(--pd-shadow-float)",

    animationName: "modalIn",
    animationDuration: "var(--pd-t-base)",
    animationTimingFunction: "var(--pd-e-out)",
    animationFillMode: "both",
  },
});

/**
 * Common flow title component — Discord-style centered
 */
export function FlowTitle(props: {
  children: JSX.Element;
  subtitle?: JSX.Element;
}) {
  return (
    <Column
      gap="sm"
      style={{
        "text-align": "center",
        "margin-bottom": "4px",
      }}
    >
      <Text
        class="title"
        size="large"
        style={{
          "font-size": "22px",
          "font-weight": "600",
          "letter-spacing": "-0.02em",
          color: "#F5F5F7",
        }}
      >
        {props.children}
      </Text>
      <Show when={props.subtitle}>
        <Text
          class="label"
          style={{
            "font-size": "14px",
            "letter-spacing": "-0.005em",
            color: "#9A98A8",
          }}
        >
          {props.subtitle}
        </Text>
      </Show>
    </Column>
  );
}
