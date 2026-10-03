import { Match, Show, Switch } from "solid-js";
import { Contrast, Download, Moon, Sun } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";

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
            <Moon size={16} stroke-width={1.75} />
          </Match>
          <Match when={state.theme.mode === "light"}>
            <Sun size={16} stroke-width={1.75} />
          </Match>
          <Match when={state.theme.mode === "system"}>
            <Contrast size={16} stroke-width={1.75} />
          </Match>
        </Switch>
        <Label>
          <Switch>
            <Match when={state.theme.mode === "dark"}>
              <Trans>Dark</Trans>
            </Match>
            <Match when={state.theme.mode === "light"}>
              <Trans>Light</Trans>
            </Match>
            <Match when={state.theme.mode === "system"}>
              <Trans>Auto</Trans>
            </Match>
          </Switch>
        </Label>
      </Bar>
      <Show when={!window.native}>
        <DownloadBar
          as="a"
          href="https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/plg-voice-desktop-setup.exe"
        >
          <Download size={16} stroke-width={1.75} />
          <Label>
            <Trans>Windows</Trans>
          </Label>
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
    padding: "6px 10px",

    border: "1px solid var(--pd-border-default)",
    borderRadius: "var(--pd-radius-sm)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    letterSpacing: "-0.005em",
    transition: "background var(--pd-transition-fast), color var(--pd-transition-fast), border-color var(--pd-transition-fast)",

    _hover: {
      background: "var(--pd-tint-subtle)",
      color: "var(--md-sys-color-on-surface)",
      borderColor: "var(--pd-border-strong)",
    },
  },
});

const DownloadBar = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    textDecoration: "none",

    border: "1px solid var(--pd-border-default)",
    borderRadius: "var(--pd-radius-sm)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    transition: "background var(--pd-transition-fast), color var(--pd-transition-fast), border-color var(--pd-transition-fast)",

    _hover: {
      background: "var(--pd-tint-subtle)",
      color: "var(--md-sys-color-on-surface)",
      borderColor: "var(--pd-border-strong)",
    },
  },
});

const Label = styled("span", {
  base: {
    fontWeight: 500,
  },
});
