import { Show, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import { useClientLifecycle } from "@revolt/client";
import { Navigate } from "@revolt/routing";

/* ── Obsidian Amethyst palette ─────────────────────── */

const BG = "#0C0A1A";
const SURFACE = "#231F33";
const ACCENT = "#7C3AED";
const ACCENT_HOVER = "#6D28D9";
const GLOW = "rgba(124,58,237,0.15)";
const TEXT = "#F0ECF9";
const TEXT_SECONDARY = "#A098B8";
const TEXT_DIMMED = "#6E6889";

/* ── Logo ──────────────────────────────────────────── */

function Logo() {
  return (
    <svg
      width="160"
      height="32"
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speech bubble icon */}
      <g transform="translate(0, 3)">
        <path
          d="M3 7c0-2.8 2.2-5 5-5h15c2.8 0 5 2.2 5 5v13c0 2.8-2.2 5-5 5h-5l-4 5-4-5H8c-2.8 0-5-2.2-5-5V7z"
          fill={TEXT}
          opacity="0.85"
        />
        <path
          d="M19 10c1.2 1 2 2.4 2 4s-.8 3-2 4"
          stroke={TEXT}
          stroke-width="1.8"
          stroke-linecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M15.5 12.5c.6.5 1 1.2 1 2s-.4 1.5-1 2"
          stroke={TEXT}
          stroke-width="1.5"
          stroke-linecap="round"
          fill="none"
          opacity="0.4"
        />
        <circle cx="11.5" cy="14.5" r="2" fill={BG} opacity="0.85" />
      </g>
      {/* PLG — bold */}
      <text
        x="36"
        y="28"
        fill={TEXT}
        font-family="Inter, system-ui, sans-serif"
        font-weight="800"
        font-size="24"
        letter-spacing="-0.5"
      >
        PLG
      </text>
      {/* Voice — lighter */}
      <text
        x="92"
        y="28"
        fill={TEXT}
        font-family="Inter, system-ui, sans-serif"
        font-weight="400"
        font-size="24"
        letter-spacing="-0.3"
        opacity="0.75"
      >
        Voice
      </text>
    </svg>
  );
}

/* ── Styled components ─────────────────────────────── */

const Page = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    background: `radial-gradient(ellipse at 30% 0%, ${GLOW} 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(37,99,235,0.10) 0%, transparent 50%), ${BG}`,
    color: TEXT,
    fontFamily: "Inter, sans-serif",
  },
});

const Nav = styled("nav", {
  base: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backdropFilter: "blur(16px)",
    background: "rgba(12,10,26,0.75)",
    borderBottom: "1px solid rgba(124,58,237,0.1)",
    md: {
      padding: "16px 32px",
    },
  },
});

const NavButtons = styled("div", {
  base: {
    display: "none",
    gap: "12px",
    md: {
      display: "flex",
    },
  },
});

/* ── Mobile menu ─────────────────────────────────── */

const BurgerButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: TEXT,
    fontSize: "24px",
    md: {
      display: "none",
    },
  },
});

const MobileMenu = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px 16px 16px",
    background: "rgba(12,10,26,0.95)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(124,58,237,0.15)",
    md: {
      display: "none",
    },
  },
});

const Hero = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "60px 16px 48px",
    gap: "20px",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",

    md: {
      padding: "120px 24px 80px",
      gap: "24px",
    },
  },
});

const HeroTitle = styled("h1", {
  base: {
    fontSize: "clamp(28px, 7vw, 64px)",
    fontWeight: 700,
    lineHeight: 1.1,
    margin: 0,
    background: `linear-gradient(135deg, ${ACCENT}, #2563EB)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
});

const HeroSubtitle = styled("p", {
  base: {
    fontSize: "clamp(15px, 3vw, 20px)",
    color: TEXT_SECONDARY,
    maxWidth: "560px",
    lineHeight: 1.6,
    margin: 0,
    padding: "0 8px",
  },
});

const HeroCTA = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    padding: "0 8px",
    md: {
      gap: "16px",
    },
  },
});

const Features = styled("section", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "0 16px 48px",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
    animationDelay: "0.15s",

    sm: {
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "24px",
      padding: "0 24px 80px",
    },
  },
});

const FeatureCard = styled("div", {
  base: {
    background: "rgba(26,23,38,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,0.15)",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    _hover: {
      borderColor: "rgba(124,58,237,0.4)",
      boxShadow: `0 4px 32px ${GLOW}`,
    },
    md: {
      padding: "32px",
    },
  },
});

const FeatureIcon = styled("div", {
  base: {
    fontSize: "28px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background: "rgba(124,58,237,0.1)",
    md: {
      fontSize: "32px",
      width: "56px",
      height: "56px",
    },
  },
});

const FeatureTitle = styled("h3", {
  base: {
    fontSize: "18px",
    fontWeight: 600,
    margin: 0,
    color: TEXT,
    md: {
      fontSize: "20px",
    },
  },
});

const FeatureDesc = styled("p", {
  base: {
    fontSize: "14px",
    color: TEXT_SECONDARY,
    lineHeight: 1.6,
    margin: 0,
    md: {
      fontSize: "15px",
    },
  },
});

/* ── Install PWA section ─────────────────────────── */

const InstallSection = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "0 16px 48px",
    gap: "24px",
    maxWidth: "720px",
    margin: "0 auto",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
    animationDelay: "0.2s",

    md: {
      padding: "0 24px 80px",
    },
  },
});

const InstallTitle = styled("h2", {
  base: {
    fontSize: "clamp(22px, 4vw, 32px)",
    fontWeight: 700,
    margin: 0,
    color: TEXT,
  },
});

const InstallCards = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    width: "100%",
    sm: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
});

const InstallCard = styled("div", {
  base: {
    background: "rgba(26,23,38,0.6)",
    border: "1px solid rgba(124,58,237,0.15)",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    textAlign: "left",
  },
});

const InstallCardTitle = styled("h3", {
  base: {
    fontSize: "18px",
    fontWeight: 600,
    margin: 0,
    color: TEXT,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
});

const InstallStep = styled("div", {
  base: {
    fontSize: "14px",
    color: TEXT_SECONDARY,
    lineHeight: 1.7,
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
  },
});

const StepNumber = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "rgba(124,58,237,0.2)",
    color: ACCENT,
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
    marginTop: "1px",
  },
});

const CTASection = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "40px 16px 48px",
    gap: "20px",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
    animationDelay: "0.3s",

    md: {
      padding: "60px 24px 80px",
    },
  },
});

const CTATitle = styled("h2", {
  base: {
    fontSize: "clamp(24px, 4vw, 40px)",
    fontWeight: 700,
    margin: 0,
  },
});

const Footer = styled("footer", {
  base: {
    textAlign: "center",
    padding: "24px 16px",
    color: TEXT_DIMMED,
    fontSize: "13px",
    borderTop: "1px solid rgba(124,58,237,0.1)",
    md: {
      padding: "32px 24px",
      fontSize: "14px",
    },
  },
});

/* ── Buttons ───────────────────────────────────────── */

const BtnPrimary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    color: "#fff",
    background: ACCENT,
    transition: "background 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    _hover: {
      background: ACCENT_HOVER,
      boxShadow: `0 0 24px ${GLOW}`,
    },
    md: {
      padding: "14px 32px",
      fontSize: "16px",
    },
  },
});

const BtnSecondary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    color: TEXT,
    background: SURFACE,
    transition: "background 0.2s",
    cursor: "pointer",
    _hover: {
      background: "rgba(35,31,51,0.8)",
    },
    md: {
      padding: "14px 32px",
      fontSize: "16px",
    },
  },
});

const BtnDownload = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    color: "#fff",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    transition: "box-shadow 0.2s, transform 0.15s",
    cursor: "pointer",
    _hover: {
      boxShadow: "0 0 32px rgba(37,99,235,0.3)",
      transform: "translateY(-1px)",
    },
    md: {
      padding: "14px 32px",
      fontSize: "16px",
    },
  },
});

/* ── Mobile menu button ─────────────────────────────── */

const BtnMobileMenu = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    color: TEXT,
    background: SURFACE,
    cursor: "pointer",
    textAlign: "center",
  },
});

const BtnMobileMenuPrimary = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    color: "#fff",
    background: ACCENT,
    cursor: "pointer",
    textAlign: "center",
  },
});

const DOWNLOAD_URL =
  "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/plg-voice-desktop-setup.exe";

/* ── Landing page ──────────────────────────────────── */

export default function LandingPage() {
  const { isLoggedIn } = useClientLifecycle();
  const [menuOpen, setMenuOpen] = createSignal(false);

  return (
    <Show when={!isLoggedIn()} fallback={<Navigate href="/" />}>
      <Titlebar />
      <Page>
        {/* ── Navbar ── */}
        <Nav>
          <Logo />
          {/* Desktop buttons */}
          <NavButtons>
            <BtnDownload href={DOWNLOAD_URL} target="_blank">
              <Trans>Download for Windows</Trans>
            </BtnDownload>
            <BtnSecondary href="/login">
              <Trans>Log in</Trans>
            </BtnSecondary>
            <BtnPrimary href="/login/create">
              <Trans>Sign up</Trans>
            </BtnPrimary>
          </NavButtons>
          {/* Mobile burger */}
          <BurgerButton onClick={() => setMenuOpen(!menuOpen())}>
            {menuOpen() ? "\u2715" : "\u2630"}
          </BurgerButton>
        </Nav>

        {/* Mobile dropdown menu */}
        <Show when={menuOpen()}>
          <MobileMenu>
            <BtnMobileMenuPrimary href="/login/create">
              <Trans>Sign up</Trans>
            </BtnMobileMenuPrimary>
            <BtnMobileMenu href="/login">
              <Trans>Log in</Trans>
            </BtnMobileMenu>
            <BtnMobileMenu href={DOWNLOAD_URL} target="_blank">
              <Trans>Download for Windows</Trans>
            </BtnMobileMenu>
          </MobileMenu>
        </Show>

        {/* ── Hero ── */}
        <Hero>
          <HeroTitle>
            <Trans>Your space. Your voice.</Trans>
          </HeroTitle>
          <HeroSubtitle>
            <Trans>
              Voice, text, and servers — all in one place. Free, open, and built
              for your community.
            </Trans>
          </HeroSubtitle>
          <HeroCTA>
            <BtnPrimary href="/login/create">
              <Trans>Get started</Trans>
            </BtnPrimary>
            <BtnSecondary href="/login">
              <Trans>I already have an account</Trans>
            </BtnSecondary>
          </HeroCTA>
          <BtnDownload href={DOWNLOAD_URL} target="_blank">
            <Trans>Download for Windows</Trans>
          </BtnDownload>
        </Hero>

        {/* ── Features ── */}
        <Features>
          <FeatureCard>
            <FeatureIcon>🎙️</FeatureIcon>
            <FeatureTitle>
              <Trans>Crystal-clear voice</Trans>
            </FeatureTitle>
            <FeatureDesc>
              <Trans>
                Low-latency voice channels with noise suppression. Talk freely
                — it just works.
              </Trans>
            </FeatureDesc>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>💬</FeatureIcon>
            <FeatureTitle>
              <Trans>Rich messaging</Trans>
            </FeatureTitle>
            <FeatureDesc>
              <Trans>
                Markdown, embeds, reactions, and threads. Everything you need
                for great conversations.
              </Trans>
            </FeatureDesc>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>🏠</FeatureIcon>
            <FeatureTitle>
              <Trans>Your own servers</Trans>
            </FeatureTitle>
            <FeatureDesc>
              <Trans>
                Create servers with channels, roles, and permissions. Build the
                community you want.
              </Trans>
            </FeatureDesc>
          </FeatureCard>
        </Features>

        {/* ── Install on phone ── */}
        <InstallSection>
          <InstallTitle>
            <Trans>Install on your phone</Trans>
          </InstallTitle>

          <InstallCards>
            <InstallCard>
              <InstallCardTitle>
                Android (Chrome)
              </InstallCardTitle>
              <InstallStep>
                <StepNumber>1</StepNumber>
                <span>
                  <Trans>Open plgames-voice.ru in Chrome</Trans>
                </span>
              </InstallStep>
              <InstallStep>
                <StepNumber>2</StepNumber>
                <span>
                  <Trans>Tap the menu (three dots) at the top right</Trans>
                </span>
              </InstallStep>
              <InstallStep>
                <StepNumber>3</StepNumber>
                <span>
                  <Trans>Tap "Install app" or "Add to Home screen"</Trans>
                </span>
              </InstallStep>
              <InstallStep>
                <StepNumber>4</StepNumber>
                <span>
                  <Trans>PLG Voice will appear as a native app on your phone</Trans>
                </span>
              </InstallStep>
            </InstallCard>

            <InstallCard>
              <InstallCardTitle>
                iPhone (Safari)
              </InstallCardTitle>
              <InstallStep>
                <StepNumber>1</StepNumber>
                <span>
                  <Trans>Open plgames-voice.ru in Safari</Trans>
                </span>
              </InstallStep>
              <InstallStep>
                <StepNumber>2</StepNumber>
                <span>
                  <Trans>Tap the Share button (square with arrow)</Trans>
                </span>
              </InstallStep>
              <InstallStep>
                <StepNumber>3</StepNumber>
                <span>
                  <Trans>Scroll down and tap "Add to Home Screen"</Trans>
                </span>
              </InstallStep>
              <InstallStep>
                <StepNumber>4</StepNumber>
                <span>
                  <Trans>PLG Voice will open full-screen like a native app</Trans>
                </span>
              </InstallStep>
            </InstallCard>
          </InstallCards>
        </InstallSection>

        {/* ── CTA ── */}
        <CTASection>
          <CTATitle>
            <Trans>Ready to start?</Trans>
          </CTATitle>
          <BtnPrimary href="/login/create">
            <Trans>Create an account</Trans>
          </BtnPrimary>
        </CTASection>

        {/* ── Footer ── */}
        <Footer>&copy; {new Date().getFullYear()} PLG Voice</Footer>
      </Page>
    </Show>
  );
}
