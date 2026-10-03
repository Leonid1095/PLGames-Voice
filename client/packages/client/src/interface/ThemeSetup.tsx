import { For, Show } from "solid-js";
import { Contrast, Moon, Sun } from "lucide-solid";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { BrandMark } from "@revolt/ui";

/**
 * Theme onboarding overlay — shown once after migration or first install.
 * Lets the user pick dark/light mode and accent color.
 */
export function ThemeSetup() {
  const state = useState();
  const { t } = useLingui();

  // The brand accent leads the list and must stay in sync with the default in
  // stores/Theme.ts — otherwise a first-run user sees no swatch selected.
  // Violet stays available as a choice; it is just no longer ours.
  const accents = [
    { color: "#E00A45", label: t`Signal` },
    { color: "#007AFF", label: t`Blue` },
    { color: "#34C759", label: t`Green` },
    { color: "#FF9500", label: t`Orange` },
    { color: "#7C3AED", label: t`Violet` },
    { color: "#AF52DE", label: t`Purple` },
  ];

  return (
    <Show when={!state.theme.setupDone}>
      <Overlay>
        <Card>
          <Logo>
            <BrandMark themed size={48} word={false} />
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
              <Moon size={20} />
              <Trans>Dark</Trans>
            </ModeButton>
            <ModeButton
              active={state.theme.mode === "light"}
              onClick={() => state.theme.setMode("light")}
            >
              <Sun size={20} />
              <Trans>Light</Trans>
            </ModeButton>
            <ModeButton
              active={state.theme.mode === "system"}
              onClick={() => state.theme.setMode("system")}
            >
              <Contrast size={20} />
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
    fontFamily: "var(--pd-font-display)",
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
    fontWeight: 700,
    fontSize: "22px",
    lineHeight: 0.95,
    letterSpacing: "0.01em",
    textTransform: "uppercase",
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
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    fontWeight: "var(--pd-weight-regular)",
    textTransform: "uppercase",
    letterSpacing: "var(--pd-tracking-label)",
    color: "var(--md-sys-color-on-surface-variant)",
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
    padding: "14px 22px",
    marginTop: "8px",
    border: "1px solid var(--md-sys-color-primary)",
    borderRadius: "12px",
    fontSize: "15px",
    fontFamily: "var(--pd-font-display)",
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
    transition:
      "background var(--pd-transition-fast), border-color var(--pd-transition-fast), transform var(--pd-transition-fast)",
    _active: { transform: "translateY(1px)" },
    _hover: {
      background: "color-mix(in srgb, var(--md-sys-color-primary) 86%, #000)",
      borderColor: "color-mix(in srgb, var(--md-sys-color-primary) 86%, #000)",
    },
  },
});
