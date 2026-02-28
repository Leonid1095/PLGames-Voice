import { Match, Switch } from "solid-js";

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
  );
}

const Bar = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    margin: "0 var(--gap-md) var(--gap-sm)",

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

const Label = styled("span", {
  base: {
    fontWeight: 500,
  },
});
