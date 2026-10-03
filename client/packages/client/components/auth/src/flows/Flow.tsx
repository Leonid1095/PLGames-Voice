import { JSX, Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { BRAND } from "@revolt/ui";

/**
 * Container for authentication page flows — the card on the auth page
 *
 * Literal light values for the same reason as AuthPage: no user, no theme.
 * Shape and type match the landing CTAs, not a Discord login card.
 */
export const FlowBase = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flexGrow: 0,

    background: "#FFFFFF",
    color: BRAND.text,

    width: "440px",
    maxWidth: "calc(100vw - 40px)",
    padding: "32px",
    borderRadius: "18px",
    border: "1px solid rgba(26,24,21,0.10)",
    boxShadow: "var(--pd-shadow-float)",

    animationName: "modalIn",
    animationDuration: "var(--pd-t-base)",
    animationTimingFunction: "var(--pd-e-out)",
    animationFillMode: "both",
  },
});

const Title = styled("div", {
  base: {
    fontFamily: "var(--pd-font-display)",
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
    fontWeight: 700,
    fontSize: "clamp(22px, 5.4vw, 28px)",
    lineHeight: 0.95,
    letterSpacing: "0.01em",
    textTransform: "uppercase",
    textAlign: "center",
    textWrap: "balance",
    color: BRAND.text,
  },
});

const Subtitle = styled("div", {
  base: {
    fontSize: "14px",
    lineHeight: 1.5,
    letterSpacing: "-0.005em",
    textAlign: "center",
    color: BRAND.text2,
    marginTop: "8px",
  },
});

/**
 * Auth heading — condensed capitals, same register as the landing hero.
 */
export function FlowTitle(props: {
  children: JSX.Element;
  subtitle?: JSX.Element;
}) {
  return (
    <div>
      <Title>{props.children}</Title>
      <Show when={props.subtitle}>
        <Subtitle>{props.subtitle}</Subtitle>
      </Show>
    </div>
  );
}

/** Submit control identical to the landing primary button. */
export const AuthSubmit = styled("button", {
  base: {
    width: "100%",
    marginTop: "8px",
    padding: "14px 22px",
    border: `1px solid ${BRAND.signal}`,
    borderRadius: "12px",
    fontFamily: "var(--pd-font-display)",
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
    fontWeight: 700,
    fontSize: "15px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    cursor: "pointer",
    color: "#FFFFFF",
    background: BRAND.signal,
    transition:
      "background var(--pd-transition-fast), border-color var(--pd-transition-fast), transform var(--pd-transition-fast)",
    _hover: {
      background: BRAND.signalDeep,
      borderColor: BRAND.signalDeep,
    },
    _active: { transform: "translateY(1px)" },
  },
});
