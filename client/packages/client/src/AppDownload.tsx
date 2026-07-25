import { styled } from "styled-system/jsx";

import { Trans } from "@lingui-solid/solid/macro";

/* ── Obsidian Amethyst palette ─────────────────────── */

const BG = "#0C0A1A";
const ACCENT = "#E00A45";
const GLOW = "rgba(124,58,237,0.15)";
const TEXT = "#F0ECF9";
const TEXT_SECONDARY = "#A098B8";
const TEXT_DIMMED = "#6E6889";
const SURFACE = "#231F33";

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
    background: `radial-gradient(ellipse at 30% 0%, ${GLOW} 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(37,99,235,0.10) 0%, transparent 50%), ${BG}`,
    color: TEXT,
    fontFamily: "Inter, sans-serif",
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
    fontSize: "clamp(24px, 5vw, 48px)",
    fontWeight: 700,
    lineHeight: 1.1,
    margin: 0,
    background: `linear-gradient(135deg, ${ACCENT}, #2563EB)`,
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
    fontSize: "clamp(18px, 3vw, 28px)",
    fontWeight: 700,
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
    background: "linear-gradient(135deg, #FF3D6A, #E00A45)",
    transition: "box-shadow 0.2s, transform 0.15s",
    cursor: "pointer",
    _hover: {
      boxShadow: "0 0 40px rgba(37,99,235,0.35)",
      transform: "translateY(-2px)",
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
    background: "rgba(124,58,237,0.15)",
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
    background: "rgba(26,23,38,0.6)",
    border: "1px solid rgba(124,58,237,0.15)",
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
    background: "rgba(124,58,237,0.2)",
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
          <stop offset="100%" stop-color="#2563EB" />
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
