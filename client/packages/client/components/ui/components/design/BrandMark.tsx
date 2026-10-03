import { JSX, Show, splitProps } from "solid-js";

import { styled } from "styled-system/jsx";

/**
 * Landing literals. Unauthenticated surfaces have no theme to read, and the
 * mark itself is brand — it does not follow the user's accent.
 */
export const BRAND = {
  paper: "#FBF9F7",
  paper2: "#F1EDE8",
  ink: "#121110",
  signal: "#E00A45",
  signalDeep: "#C00538",
  live: "#00C48C",
  text: "#1A1815",
  text2: "#57534C",
  text3: "#8A8479",
} as const;

/** Squircle + four amplitude bars — the same object as the landing nav. */
export function BrandGlyph(props: { size?: number }) {
  const size = () => props.size ?? 26;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <rect width="26" height="26" rx="7" fill={BRAND.signal} />
      <g fill={BRAND.paper}>
        <rect x="6" y="11" width="2.5" height="4" rx="1.25" />
        <rect x="10" y="8" width="2.5" height="10" rx="1.25" />
        <rect x="14" y="6" width="2.5" height="14" rx="1.25" />
        <rect x="18" y="10" width="2.5" height="6" rx="1.25" />
      </g>
    </svg>
  );
}

type BrandMarkProps = {
  size?: number;
  word?: boolean;
  href?: string;
  /** After login the word follows the theme; the glyph stays signal. */
  themed?: boolean;
} & JSX.HTMLAttributes<HTMLAnchorElement | HTMLSpanElement>;

/**
 * Product mark. One drawing, used on the splash, landing, /app, auth, home
 * and the desktop titlebar — so those surfaces stop being three products.
 */
export function BrandMark(props: BrandMarkProps) {
  const [local, rest] = splitProps(props, [
    "size",
    "word",
    "href",
    "themed",
    "children",
  ]);
  const size = () => local.size ?? 26;
  const showWord = () => local.word !== false;
  const wordSize = () => Math.max(11, Math.round((size() / 26) * 22));

  const inner = (
    <>
      <BrandGlyph size={size()} />
      <Show when={showWord()}>
        <Word themed={local.themed} style={{ "font-size": `${wordSize()}px` }}>
          PLG<b>VOICE</b>
        </Word>
      </Show>
    </>
  );

  const row = <Row>{inner}</Row>;

  if (local.href) {
    return (
      <a
        href={local.href}
        style={{ "text-decoration": "none", color: "inherit" }}
        {...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {row}
      </a>
    );
  }

  return (
    <span {...(rest as JSX.HTMLAttributes<HTMLSpanElement>)}>{row}</span>
  );
}

const Row = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "inherit",
    flexShrink: 0,
    lineHeight: 1,
  },
});

const Word = styled("span", {
  base: {
    fontFamily: "var(--pd-font-display)",
    fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    lineHeight: 0.92,
    color: BRAND.text3,
    "& b": { color: BRAND.text, fontWeight: 700 },
  },
  variants: {
    themed: {
      true: {
        color: "var(--md-sys-color-on-surface-variant)",
        "& b": { color: "var(--md-sys-color-on-surface)", fontWeight: 700 },
      },
    },
  },
});
