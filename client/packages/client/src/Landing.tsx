import { Show, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import { useClientLifecycle } from "@revolt/client";
import { Navigate } from "@revolt/routing";

/* ── Quiet Pro palette — refined neutrals + restrained accent ─────── */

const BG = "#0B0A12";
const SURFACE = "#181722";
const SURFACE_ELEVATED = "#1F1D2C";
// Полдень signal red. Literal rather than var(--md-sys-color-*) because the
// landing renders before any theme is loaded — there is no logged-in user to
// have a theme. The full landing rework is a later step; this only takes the
// old Discord violet off it.
const ACCENT = "#E00A45";
const ACCENT_HOVER = "#FF3D6A";
const ACCENT_SUBTLE = "rgba(224,10,69,0.08)";
const GLOW = "rgba(224,10,69,0.18)";
const TEXT = "#F5F5F7";
const TEXT_SECONDARY = "#9A98A8";
const TEXT_DIMMED = "#5C5A6E";
const BORDER_SUBTLE = "rgba(255,255,255,0.06)";
const BORDER_DEFAULT = "rgba(255,255,255,0.10)";

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
    /* Subtle mesh gradient — Apple/Linear style, low saturation */
    background: `
      radial-gradient(ellipse 80% 50% at 50% -10%, ${GLOW} 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 90% 30%, rgba(56,189,248,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 10% 80%, rgba(244,114,182,0.04) 0%, transparent 60%),
      ${BG}
    `,
    color: TEXT,
    fontFamily: "var(--qp-font-sans)",
    fontFeatureSettings: '"ss01","cv02","cv11"',
    letterSpacing: "var(--qp-tracking-snug)",
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
    padding: "14px 20px",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    background: "rgba(11,10,18,0.72)",
    borderBottom: `1px solid ${BORDER_SUBTLE}`,
    md: {
      padding: "18px 40px",
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
    padding: "14px 20px 18px",
    background: "rgba(11,10,18,0.92)",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    borderBottom: `1px solid ${BORDER_SUBTLE}`,
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
    fontSize: "clamp(36px, 6vw, 56px)",
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: "-0.035em",
    margin: 0,
    maxWidth: "820px",
    color: TEXT,
    /* Single hint of color via subtle vertical gradient — Apple style */
    background: `linear-gradient(180deg, ${TEXT} 0%, color-mix(in srgb, ${TEXT} 78%, ${ACCENT}) 100%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
});

const HeroSubtitle = styled("p", {
  base: {
    fontSize: "clamp(16px, 2.4vw, 20px)",
    fontWeight: 400,
    color: TEXT_SECONDARY,
    maxWidth: "640px",
    lineHeight: 1.55,
    letterSpacing: "-0.005em",
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
    background: SURFACE_ELEVATED,
    backdropFilter: "saturate(140%) blur(12px)",
    WebkitBackdropFilter: "saturate(140%) blur(12px)",
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: "14px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    transition: "border-color var(--pd-transition-base), transform var(--pd-transition-base), box-shadow var(--pd-transition-base)",
    _hover: {
      borderColor: BORDER_DEFAULT,
      transform: "translateY(-2px)",
      boxShadow: `0 12px 32px rgba(0,0,0,0.32), 0 0 0 1px ${BORDER_DEFAULT} inset`,
    },
    md: {
      padding: "32px",
    },
  },
});

const FeatureIcon = styled("div", {
  base: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: ACCENT_SUBTLE,
    border: `1px solid ${BORDER_SUBTLE}`,
    color: ACCENT_HOVER,
  },
});

const FeatureTitle = styled("h3", {
  base: {
    fontSize: "17px",
    fontWeight: 600,
    letterSpacing: "-0.015em",
    lineHeight: 1.3,
    margin: 0,
    color: TEXT,
    md: {
      fontSize: "18px",
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
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    lineHeight: 1.1,
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
    background: SURFACE_ELEVATED,
    border: `1px solid ${BORDER_SUBTLE}`,
    borderRadius: "14px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
    minWidth: "20px",
    height: "20px",
    borderRadius: "50%",
    background: ACCENT_SUBTLE,
    border: `1px solid ${BORDER_SUBTLE}`,
    color: ACCENT_HOVER,
    fontSize: "11px",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
    marginTop: "2px",
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
    fontSize: "clamp(26px, 4.5vw, 42px)",
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    margin: 0,
  },
});

const Footer = styled("footer", {
  base: {
    textAlign: "center",
    padding: "32px 16px",
    color: TEXT_DIMMED,
    fontSize: "13px",
    letterSpacing: "-0.005em",
    borderTop: `1px solid ${BORDER_SUBTLE}`,
    md: {
      padding: "40px 24px",
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
    padding: "11px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    textDecoration: "none",
    color: "#fff",
    background: ACCENT,
    border: "1px solid color-mix(in srgb, white 12%, transparent)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)",
    transition: "background var(--pd-transition-base), transform var(--pd-transition-fast), box-shadow var(--pd-transition-base)",
    cursor: "pointer",
    _hover: {
      background: ACCENT_HOVER,
      boxShadow: `0 4px 16px ${GLOW}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    },
    _active: {
      transform: "scale(0.98)",
    },
    md: {
      padding: "13px 26px",
      fontSize: "15px",
    },
  },
});

const BtnSecondary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    textDecoration: "none",
    color: TEXT,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${BORDER_DEFAULT}`,
    transition: "background var(--pd-transition-base), border-color var(--pd-transition-base), transform var(--pd-transition-fast)",
    cursor: "pointer",
    _hover: {
      background: "rgba(255,255,255,0.07)",
      borderColor: "rgba(255,255,255,0.16)",
    },
    _active: {
      transform: "scale(0.98)",
    },
    md: {
      padding: "13px 26px",
      fontSize: "15px",
    },
  },
});

const BtnDownload = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "9px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    textDecoration: "none",
    color: TEXT_SECONDARY,
    background: "transparent",
    border: `1px solid ${BORDER_DEFAULT}`,
    transition: "background var(--pd-transition-base), border-color var(--pd-transition-base), color var(--pd-transition-base)",
    cursor: "pointer",
    _hover: {
      background: "rgba(255,255,255,0.04)",
      borderColor: "rgba(255,255,255,0.18)",
      color: TEXT,
    },
    _active: {
      transform: "scale(0.98)",
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

const DOWNLOAD_WIN =
  "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/plg-voice-desktop-setup.exe";
const DOWNLOAD_LINUX =
  "https://github.com/Leonid1095/PLGames-Voice/releases/latest/download/PLG-Voice-linux-x64-2.0.0.zip";

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
            <BtnDownload href={DOWNLOAD_WIN} target="_blank">
              Windows
            </BtnDownload>
            <BtnDownload href={DOWNLOAD_LINUX} target="_blank">
              Linux
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
            <BtnMobileMenu href={DOWNLOAD_WIN} target="_blank">
              Windows
            </BtnMobileMenu>
            <BtnMobileMenu href={DOWNLOAD_LINUX} target="_blank">
              Linux (.deb)
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
        </Hero>

        {/* ── Features ── */}
        <Features>
          <FeatureCard>
            <FeatureIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <path d="M12 19v3" />
              </svg>
            </FeatureIcon>
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
            <FeatureIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </FeatureIcon>
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
            <FeatureIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="6" rx="2" />
                <rect x="2" y="15" width="20" height="6" rx="2" />
                <path d="M6 6h.01M6 18h.01" />
              </svg>
            </FeatureIcon>
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
