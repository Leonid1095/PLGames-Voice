import { Match, Show, Switch } from "solid-js";

import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Quick theme mode toggle in the sidebar
 */
export function ThemeToggle() {
  const state = useState();

  function cycle() {
    const current = state.theme.mode;
    if (current === "dark") {
      state.theme.setMode("light");
    } else if (current === "light") {
      state.theme.setMode("system");
    } else {
      state.theme.setMode("dark");
    }
  }

  return (
    <Row>
      <Bar onClick={cycle}>
        <Switch>
          <Match when={state.theme.mode === "dark"}>
            <Symbol size={16}>dark_mode</Symbol>
          </Match>
          <Match when={state.theme.mode === "light"}>
            <Symbol size={16}>light_mode</Symbol>
          </Match>
          <Match when={state.theme.mode === "system"}>
            <Symbol size={16}>contrast</Symbol>
          </Match>
        </Switch>
        <Label>
          <Switch>
            <Match when={state.theme.mode === "dark"}>Dark</Match>
            <Match when={state.theme.mode === "light"}>Light</Match>
            <Match when={state.theme.mode === "system"}>Auto</Match>
          </Switch>
        </Label>
      </Bar>
      <Show when={!window.native}>
        <DownloadBar
          as="a"
          href="https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/plg-voice-desktop-setup.exe"
        >
          <Symbol size={16}>download</Symbol>
          <Label>Windows</Label>
        </DownloadBar>
      </Show>
    </Row>
  );
}

const Row = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    margin: "0 var(--gap-md) var(--gap-sm)",
  },
});

const Bar = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",

    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "var(--borderRadius-full)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    transition: "var(--transitions-fast) all",

    _hover: {
      background: "var(--md-sys-color-surface-container-highest)",
      color: "var(--md-sys-color-on-surface)",
    },
  },
});

const DownloadBar = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    textDecoration: "none",

    border: "1px solid color-mix(in srgb, #7C3AED 40%, transparent)",
    borderRadius: "var(--borderRadius-full)",
    background: "color-mix(in srgb, #7C3AED 12%, transparent)",
    color: "#B8A0E8",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: 500,
    transition: "var(--transitions-fast) all",

    _hover: {
      background: "color-mix(in srgb, #7C3AED 25%, transparent)",
      color: "#D4C4F0",
      borderColor: "color-mix(in srgb, #7C3AED 60%, transparent)",
    },
  },
});

const Label = styled("span", {
  base: {
    fontWeight: 500,
  },
});
