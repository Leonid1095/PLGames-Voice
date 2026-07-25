import { JSX, Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { Column, Text } from "@revolt/ui";

/**
 * Container for authentication page flows — Obsidian Amethyst card
 */
export const FlowBase = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flexGrow: 0,

    background: "#181722",
    color: "#F5F5F7",

    width: "440px",
    maxWidth: "calc(100vw - 40px)",
    padding: "32px",
    borderRadius: "14px",
    border: "1px solid var(--pd-border-default)",
    boxShadow: "var(--pd-shadow-float)",

    animationName: "modalIn",
    animationDuration: "0.22s",
    animationTimingFunction: "cubic-bezier(0.05, 0.7, 0.1, 1)",
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
