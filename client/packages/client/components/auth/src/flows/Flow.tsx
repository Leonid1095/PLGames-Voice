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

    background: "#1A1726",
    color: "#F0ECF9",

    width: "480px",
    maxWidth: "calc(100vw - 40px)",
    padding: "32px",
    borderRadius: "12px",
    border: "1px solid rgba(124,58,237,0.2)",
    boxShadow: "0 4px 24px 0 rgba(124,58,237,0.15)",

    animationName: "contentFadeIn",
    animationDuration: "0.3s",
    animationTimingFunction: "ease-out",
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
          "font-size": "24px",
          "font-weight": "600",
          color: "#F0ECF9",
        }}
      >
        {props.children}
      </Text>
      <Show when={props.subtitle}>
        <Text
          class="label"
          style={{
            "font-size": "14px",
            color: "#A098B8",
          }}
        >
          {props.subtitle}
        </Text>
      </Show>
    </Column>
  );
}
