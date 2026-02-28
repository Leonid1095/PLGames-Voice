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

  const accents = [
    { color: "#7C3AED", label: "Violet" },
    { color: "#007AFF", label: "Blue" },
    { color: "#34C759", label: "Green" },
    { color: "#FF9500", label: "Orange" },
    { color: "#FF3B30", label: "Red" },
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
                  <stop offset="0%" stop-color="#7C3AED" />
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
    background: "rgba(12, 10, 26, 0.85)",
    backdropFilter: "blur(8px)",
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
    gap: "16px",
    padding: "40px",
    width: "380px",
    maxWidth: "calc(100vw - 32px)",
    borderRadius: "20px",
    background: "var(--md-sys-color-surface-container)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    animationName: "contentFadeIn",
    animationDuration: "0.4s",
    animationDelay: "0.1s",
    animationFillMode: "both",
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
    fontWeight: 700,
    color: "var(--md-sys-color-on-surface)",
    textAlign: "center",
  },
});

const Subtitle = styled("p", {
  base: {
    margin: 0,
    fontSize: "14px",
    color: "var(--md-sys-color-on-surface-variant)",
    textAlign: "center",
  },
});

const SectionLabel = styled("div", {
  base: {
    width: "100%",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "var(--md-sys-color-outline)",
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
    border: "2px solid var(--md-sys-color-outline-variant)",
    borderRadius: "12px",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  variants: {
    active: {
      true: {
        borderColor: "var(--md-sys-color-primary)",
        background: "color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)",
        color: "var(--md-sys-color-primary)",
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
    transition: "all 0.2s",
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
    padding: "14px",
    marginTop: "8px",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
    transition: "background 0.2s, box-shadow 0.2s",
    _hover: {
      boxShadow: "0 0 20px rgba(124,58,237,0.3)",
    },
  },
});
