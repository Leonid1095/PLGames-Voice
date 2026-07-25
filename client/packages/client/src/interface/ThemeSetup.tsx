import { For, Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";

/**
 * Theme onboarding overlay — shown once after migration or first install.
 * Lets the user pick dark/light mode and accent color.
 */
export function ThemeSetup() {
  const state = useState();

  // The brand accent leads the list and must stay in sync with the default in
  // stores/Theme.ts — otherwise a first-run user sees no swatch selected.
  // Violet stays available as a choice; it is just no longer ours.
  const accents = [
    { color: "#E00A45", label: "Signal" },
    { color: "#007AFF", label: "Blue" },
    { color: "#34C759", label: "Green" },
    { color: "#FF9500", label: "Orange" },
    { color: "#7C3AED", label: "Violet" },
    { color: "#AF52DE", label: "Purple" },
  ];

  return (
    <Show when={!state.theme.setupDone}>
      <Overlay>
        <Card>
          <Logo>
            <svg
              width="48"
              height="48"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
                fill="url(#tsg)"
                opacity="0.9"
              />
              <path
                d="M16 10 L16 22 M11 13 L16 10 L21 13 M11 19 L16 22 L21 19"
                stroke="#fff"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
              <defs>
                <linearGradient id="tsg" x1="4" y1="2" x2="28" y2="30">
                  <stop offset="0%" stop-color="#E00A45" />
                  <stop offset="100%" stop-color="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
          </Logo>

          <Title>
            <Trans>Choose your style</Trans>
          </Title>
          <Subtitle>
            <Trans>You can always change this in Settings.</Trans>
          </Subtitle>

          {/* Mode selector */}
          <SectionLabel>
            <Trans>Theme</Trans>
          </SectionLabel>
          <ModeRow>
            <ModeButton
              active={state.theme.mode === "dark"}
              onClick={() => state.theme.setMode("dark")}
            >
              <span class="material-symbols-outlined" style={{ "font-size": "20px" }}>
                dark_mode
              </span>
              <Trans>Dark</Trans>
            </ModeButton>
            <ModeButton
              active={state.theme.mode === "light"}
              onClick={() => state.theme.setMode("light")}
            >
              <span class="material-symbols-outlined" style={{ "font-size": "20px" }}>
                light_mode
              </span>
              <Trans>Light</Trans>
            </ModeButton>
            <ModeButton
              active={state.theme.mode === "system"}
              onClick={() => state.theme.setMode("system")}
            >
              <span class="material-symbols-outlined" style={{ "font-size": "20px" }}>
                contrast
              </span>
              <Trans>Auto</Trans>
            </ModeButton>
          </ModeRow>

          {/* Accent selector */}
          <SectionLabel>
            <Trans>Accent color</Trans>
          </SectionLabel>
          <AccentRow>
            <For each={accents}>
              {(a) => (
                <AccentDot
                  style={{ background: a.color }}
                  active={state.theme.m3Accent === a.color}
                  onClick={() => state.theme.setM3Accent(a.color)}
                  title={a.label}
                />
              )}
            </For>
          </AccentRow>

          {/* Done */}
          <DoneButton onClick={() => state.theme.completeSetup()}>
            <Trans>Continue</Trans>
          </DoneButton>
        </Card>
      </Overlay>
    </Show>
  );
}

/* ── Styled ──────────────────────────────────────── */

const Overlay = styled("div", {
  base: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    animationName: "contentFadeIn",
    animationDuration: "0.3s",
    animationFillMode: "both",
  },
});

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "18px",
    padding: "36px",
    width: "400px",
    maxWidth: "calc(100vw - 32px)",
    borderRadius: "var(--pd-radius-lg)",
    background: "var(--md-sys-color-surface-container-low)",
    border: "1px solid var(--pd-border-default)",
    boxShadow: "var(--pd-shadow-float)",
    animation: "modalIn var(--pd-transition-base) both",
  },
});

const Logo = styled("div", {
  base: {
    marginBottom: "4px",
  },
});

const Title = styled("h2", {
  base: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--md-sys-color-on-surface)",
    textAlign: "center",
  },
});

const Subtitle = styled("p", {
  base: {
    margin: 0,
    fontSize: "14px",
    letterSpacing: "-0.005em",
    color: "var(--md-sys-color-on-surface-variant)",
    textAlign: "center",
  },
});

const SectionLabel = styled("div", {
  base: {
    width: "100%",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
    marginTop: "8px",
  },
});

const ModeRow = styled("div", {
  base: {
    display: "flex",
    gap: "8px",
    width: "100%",
  },
});

const ModeButton = styled("button", {
  base: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "14px 8px",
    border: "1px solid var(--pd-border-default)",
    borderRadius: "var(--pd-radius-md)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    transition: "background var(--pd-transition-base), border-color var(--pd-transition-base), color var(--pd-transition-base)",
    _hover: {
      background: "var(--pd-tint-subtle)",
      color: "var(--md-sys-color-on-surface)",
    },
  },
  variants: {
    active: {
      true: {
        borderColor: "var(--md-sys-color-primary)",
        background: "color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)",
        color: "var(--md-sys-color-on-surface)",
        boxShadow: "0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent)",
      },
    },
  },
});

const AccentRow = styled("div", {
  base: {
    display: "flex",
    gap: "10px",
    width: "100%",
    justifyContent: "center",
  },
});

const AccentDot = styled("button", {
  base: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid transparent",
    cursor: "pointer",
    transition: "background-color var(--pd-transition-base), border-color var(--pd-transition-base), color var(--pd-transition-base), box-shadow var(--pd-transition-base)",
    _hover: {
      transform: "scale(1.1)",
    },
  },
  variants: {
    active: {
      true: {
        borderColor: "var(--md-sys-color-on-surface)",
        transform: "scale(1.15)",
      },
    },
  },
});

const DoneButton = styled("button", {
  base: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    border: "1px solid color-mix(in srgb, white 12%, transparent)",
    borderRadius: "var(--pd-radius-md)",
    fontSize: "14px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    fontFamily: "inherit",
    cursor: "pointer",
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
    boxShadow: "var(--pd-shadow-raised), inset 0 1px 0 rgba(255,255,255,0.12)",
    transition: "background var(--pd-transition-base), box-shadow var(--pd-transition-base), transform var(--pd-transition-fast)",
    _active: { transform: "scale(0.98)" },
    _hover: {
      boxShadow: "0 4px 16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.18)",
    },
  },
});
