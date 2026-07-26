import { splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";

import { cva } from "styled-system/css";

/**
 * Simple span Text wrapper to apply Typography styles
 *
 * @specification https://m3.material.io/styles/typography/type-scale-tokens
 */
export function Text(
  props: Parameters<typeof typography>[0] & { children: JSX.Element },
) {
  const [local, remote] = splitProps(props, ["children"]);
  return <span class={typography(remote)}>{local.children}</span>;
}

/**
 * Apply styles for chosen typography
 *
 * @specification https://m3.material.io/styles/typography/type-scale-tokens
 */
/*
 * Полдень type scale.
 *
 * This recipe is the app's typography — every settings title, channel name,
 * modal heading and body paragraph renders through it. It previously held
 * stock Material 3 values (weight 400-550, zero tracking, Roboto metrics),
 * which is why the redesign was invisible: the display face was applied to
 * h1-h6, and almost nothing in this app is an h-tag. Titles are <span>s
 * produced here.
 *
 * Three families, by role:
 *   display / headline / title  condensed grotesque, 700
 *   body                        the user's chosen text face
 *   label                       the same face, medium, tightened
 *
 * No text-transform. Capitals are part of the direction but belong on chrome
 * only, opted into with .pd-title — `title` also carries channel and server
 * names, and a server called "PLG Сообщество" must not be shouted.
 *
 * Sizes run ~8% larger than the Material values they replace: a condensed
 * face sets narrower, so matching the old apparent size needs more points.
 * Leading is tighter throughout — the Material scale is built for documents,
 * and this is a dense application.
 */
const DISPLAY_FACE = {
  fontFamily: "var(--pd-font-display)",
  fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
  fontWeight: 700,
  letterSpacing: "0.005em",
} as const;

export const typography = cva({
  variants: {
    class: {
      display: DISPLAY_FACE,
      headline: DISPLAY_FACE,
      title: DISPLAY_FACE,

      body: {
        fontFamily: "var(--pd-font-sans)",
        fontWeight: "var(--pd-weight-regular)",
        letterSpacing: "var(--pd-tracking-snug)",
      },
      label: {
        fontFamily: "var(--pd-font-sans)",
        fontWeight: "var(--pd-weight-medium)",
        letterSpacing: "var(--pd-tracking-normal)",
      },

      _messages: {
        fontFamily: "var(--pd-font-sans)",
        fontWeight: "var(--pd-weight-regular)",
        fontSize: "var(--message-size)",
        letterSpacing: "var(--pd-tracking-snug)",
      },

      _status: {
        fontFamily: "var(--pd-font-sans)",
        fontWeight: "var(--pd-weight-regular)",
        fontSize: "var(--pd-text-xs)",
      },
    },
    size: {
      large: {},
      medium: {},
      small: {},
    },
  },
  // Size only. Family, weight and tracking come from the class variant above
  // and must not be repeated here: compound variants win, and duplicating
  // them is how the old values quietly overrode everything.
  compoundVariants: [
    { class: "display", size: "large", css: { fontSize: "3.75rem", lineHeight: "1.04" } },
    { class: "display", size: "medium", css: { fontSize: "3rem", lineHeight: "1.05" } },
    { class: "display", size: "small", css: { fontSize: "2.375rem", lineHeight: "1.08" } },

    { class: "headline", size: "large", css: { fontSize: "2.125rem", lineHeight: "1.1" } },
    { class: "headline", size: "medium", css: { fontSize: "1.875rem", lineHeight: "1.12" } },
    { class: "headline", size: "small", css: { fontSize: "1.625rem", lineHeight: "1.15" } },

    { class: "title", size: "large", css: { fontSize: "1.5rem", lineHeight: "1.2" } },
    { class: "title", size: "medium", css: { fontSize: "1.125rem", lineHeight: "1.25" } },
    { class: "title", size: "small", css: { fontSize: "0.9375rem", lineHeight: "1.3" } },

    { class: "body", size: "large", css: { fontSize: "1rem", lineHeight: "1.5" } },
    { class: "body", size: "medium", css: { fontSize: "0.875rem", lineHeight: "1.5" } },
    { class: "body", size: "small", css: { fontSize: "0.8125rem", lineHeight: "1.45" } },

    { class: "label", size: "large", css: { fontSize: "0.875rem", lineHeight: "1.2" } },
    { class: "label", size: "medium", css: { fontSize: "0.8125rem", lineHeight: "1.2" } },
    { class: "label", size: "small", css: { fontSize: "0.6875rem", lineHeight: "1.2" } },
  ],
  defaultVariants: {
    class: "body",
    size: "medium",
  },
});
