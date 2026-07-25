import { styled } from "styled-system/jsx";

import { Trans } from "@lingui-solid/solid/macro";

/* ── Полдень palette ────────────────────────────────────────────────
 *
 * Same literals as Landing.tsx, for the same reason: this page renders with
 * no logged-in user and therefore no theme to read. The two pages sit one
 * click apart and have to match.
 */

const BG = "#FBF9F7";
const ACCENT = "#E00A45";
const ACCENT_HOVER = "#C00538";
const GLOW = "rgba(224,10,69,0.13)";
const TEXT = "#16131C";
const TEXT_SECONDARY = "#55505F";
const TEXT_DIMMED = "#8A8494";
const SURFACE = "#FFFFFF";

/* Condensed capitals, matching the landing. */
const DISPLAY = {
  fontFamily: "var(--pd-font-display)",
  fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
  fontWeight: 700,
  textTransform: "uppercase",
  lineHeight: 1.05,
} as const;

const DOWNLOAD_URL =
  "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/plg-voice-desktop-setup.exe";

/* ── Styled components ─────────────────────────────── */

const Page = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    // One accent wash. The blue radial that sat under it was a colour this
    // product does not use anywhere.
    background: `radial-gradient(ellipse 90% 55% at 50% -12%, ${GLOW} 0%, transparent 62%), ${BG}`,
    color: TEXT,
    fontFamily: "var(--pd-font-sans)",
    gap: "32px",
    padding: "40px 16px",
    textAlign: "center",
    md: {
      padding: "60px 24px",
      justifyContent: "center",
    },
  },
});

const Title = styled("h1", {
  base: {
    ...DISPLAY,
    fontSize: "clamp(30px, 6vw, 60px)",
    letterSpacing: "0.01em",
    margin: 0,
    background: `linear-gradient(175deg, ${TEXT} 30%, color-mix(in srgb, ${TEXT} 55%, ${ACCENT}) 100%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
});

const Subtitle = styled("p", {
  base: {
    fontSize: "clamp(14px, 2vw, 18px)",
    color: TEXT_SECONDARY,
    maxWidth: "480px",
    lineHeight: 1.6,
    margin: 0,
  },
});

const SectionTitle = styled("h2", {
  base: {
    ...DISPLAY,
    fontSize: "clamp(20px, 3.4vw, 32px)",
    letterSpacing: "0.01em",
    margin: 0,
    color: TEXT,
  },
});

const BtnDownload = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "16px 36px",
    borderRadius: "var(--pd-radius-md)",
    fontSize: "16px",
    fontWeight: 700,
    textDecoration: "none",
    color: "#fff",
    background: ACCENT,
    boxShadow: "var(--pd-shadow-raised), inset 0 1px 0 rgba(255,255,255,0.14)",
    transition:
      "background var(--pd-transition-base), box-shadow var(--pd-transition-base), transform var(--pd-transition-fast)",
    cursor: "pointer",
    _hover: {
      background: ACCENT_HOVER,
      boxShadow: `0 4px 16px ${GLOW}, inset 0 1px 0 rgba(255,255,255,0.18)`,
      transform: "translateY(-2px)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      _hover: { transform: "none" },
    },
    md: {
      padding: "18px 48px",
      fontSize: "18px",
    },
  },
});

const BtnSecondary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    borderRadius: "var(--pd-radius-sm)",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    color: TEXT_SECONDARY,
    background: SURFACE,
    transition: "background 0.2s, color 0.2s",
    cursor: "pointer",
    _hover: {
      background: "rgba(35,31,51,0.8)",
      color: TEXT,
    },
    md: {
      padding: "12px 28px",
      fontSize: "15px",
    },
  },
});

const Links = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});

const Footer = styled("div", {
  base: {
    color: TEXT_DIMMED,
    fontSize: "13px",
  },
});

const Divider = styled("div", {
  base: {
    width: "100%",
    maxWidth: "480px",
    height: "1px",
    background: "rgba(22,19,28,0.10)",
  },
});

const InstallCards = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    width: "100%",
    maxWidth: "560px",
    sm: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
});

const InstallCard = styled("div", {
  base: {
    background: SURFACE,
    border: "1px solid rgba(22,19,28,0.10)",
    borderRadius: "var(--pd-radius-xl)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "left",
  },
});

const InstallCardTitle = styled("h3", {
  base: {
    fontSize: "16px",
    fontWeight: 600,
    margin: 0,
    color: TEXT,
  },
});

const InstallStep = styled("div", {
  base: {
    fontSize: "13px",
    color: TEXT_SECONDARY,
    lineHeight: 1.6,
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
  },
});

const StepNum = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(224,10,69,0.10)",
    color: ACCENT,
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
    marginTop: "1px",
  },
});

/* ── Logo ──────────────────────────────────────────── */

function LogoIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
        fill="url(#dlGrad)"
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
        <linearGradient id="dlGrad" x1="4" y1="2" x2="28" y2="30">
          <stop offset="0%" stop-color="#E00A45" />
          <stop offset="100%" stop-color="#FF3D6A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Download page ─────────────────────────────────── */

export default function AppDownloadPage() {
  return (
    <Page>
      <LogoIcon />
      <Title>
        <Trans>Download PLG Voice</Trans>
      </Title>
      <Subtitle>
        <Trans>
          Desktop app for Windows — voice, text, and servers in one place.
        </Trans>
      </Subtitle>
      <BtnDownload href={DOWNLOAD_URL} target="_blank">
        <Trans>Download for Windows</Trans>
      </BtnDownload>
      <Footer>Windows 10+ &bull; 64-bit &bull; ~117 MB</Footer>

      <Divider />

      <SectionTitle>
        <Trans>Install on your phone</Trans>
      </SectionTitle>
      <Subtitle>
        <Trans>
          PLG Voice works as a web app on any phone — no app store needed.
        </Trans>
      </Subtitle>

      <InstallCards>
        <InstallCard>
          <InstallCardTitle>Android</InstallCardTitle>
          <InstallStep>
            <StepNum>1</StepNum>
            <span>
              <Trans>Open plgames-voice.ru in Chrome</Trans>
            </span>
          </InstallStep>
          <InstallStep>
            <StepNum>2</StepNum>
            <span>
              <Trans>Tap menu (three dots) at top right</Trans>
            </span>
          </InstallStep>
          <InstallStep>
            <StepNum>3</StepNum>
            <span>
              <Trans>Tap "Install app"</Trans>
            </span>
          </InstallStep>
        </InstallCard>

        <InstallCard>
          <InstallCardTitle>iPhone</InstallCardTitle>
          <InstallStep>
            <StepNum>1</StepNum>
            <span>
              <Trans>Open plgames-voice.ru in Safari</Trans>
            </span>
          </InstallStep>
          <InstallStep>
            <StepNum>2</StepNum>
            <span>
              <Trans>Tap the Share button (square with arrow)</Trans>
            </span>
          </InstallStep>
          <InstallStep>
            <StepNum>3</StepNum>
            <span>
              <Trans>Tap "Add to Home Screen"</Trans>
            </span>
          </InstallStep>
        </InstallCard>
      </InstallCards>

      <Links>
        <BtnSecondary href="/welcome">
          <Trans>Home</Trans>
        </BtnSecondary>
        <BtnSecondary href="/login">
          <Trans>Log in</Trans>
        </BtnSecondary>
        <BtnSecondary href="/login/create">
          <Trans>Sign up</Trans>
        </BtnSecondary>
      </Links>
    </Page>
  );
}
