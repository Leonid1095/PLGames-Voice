import { styled } from "styled-system/jsx";

/* ── Obsidian Amethyst palette ─────────────────────── */

const BG = "#0C0A1A";
const ACCENT = "#7C3AED";
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `radial-gradient(ellipse at 30% 0%, ${GLOW} 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(37,99,235,0.10) 0%, transparent 50%), ${BG}`,
    color: TEXT,
    fontFamily: "Inter, sans-serif",
    gap: "32px",
    padding: "24px",
    textAlign: "center",
  },
});

const Title = styled("h1", {
  base: {
    fontSize: "clamp(28px, 5vw, 48px)",
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
    fontSize: "clamp(15px, 2vw, 18px)",
    color: TEXT_SECONDARY,
    maxWidth: "480px",
    lineHeight: 1.6,
    margin: 0,
  },
});

const BtnDownload = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "18px 48px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: 700,
    textDecoration: "none",
    color: "#fff",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    transition: "box-shadow 0.2s, transform 0.15s",
    cursor: "pointer",
    _hover: {
      boxShadow: "0 0 40px rgba(37,99,235,0.35)",
      transform: "translateY(-2px)",
    },
  },
});

const BtnSecondary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 28px",
    borderRadius: "8px",
    fontSize: "15px",
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

/* ── Logo ──────────────────────────────────────────── */

function LogoIcon() {
  return (
    <svg
      width="72"
      height="72"
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
          <stop offset="0%" stop-color="#7C3AED" />
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
      <Title>Скачать PLG Voice</Title>
      <Subtitle>
        Десктоп-приложение для Windows — голос, текст и серверы в одном месте.
      </Subtitle>
      <BtnDownload href={DOWNLOAD_URL} target="_blank">
        ⬇ Скачать для Windows
      </BtnDownload>
      <Links>
        <BtnSecondary href="/welcome">На главную</BtnSecondary>
        <BtnSecondary href="/login">Войти</BtnSecondary>
        <BtnSecondary href="/login/create">Регистрация</BtnSecondary>
      </Links>
      <Footer>Windows 10+ • 64-bit • ~117 МБ</Footer>
    </Page>
  );
}
