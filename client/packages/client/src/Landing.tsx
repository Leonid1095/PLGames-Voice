import { Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { Navigate } from "@revolt/routing";

import wordmarkUrl from "../scripts/assets_fallback/web/wordmark.svg";

/* ── Obsidian Amethyst palette ─────────────────────── */

const BG = "#0C0A1A";
const CARD = "#1A1726";
const SURFACE = "#231F33";
const ACCENT = "#7C3AED";
const ACCENT_HOVER = "#6D28D9";
const GLOW = "rgba(124,58,237,0.15)";
const LINK = "#A78BFA";
const TEXT = "#F0ECF9";
const TEXT_SECONDARY = "#A098B8";
const TEXT_DIMMED = "#6E6889";

/* ── Styled components ─────────────────────────────── */

const Page = styled("div", {
  base: {
    width: "100%",
    minHeight: "100vh",
    background: `radial-gradient(ellipse at 30% 0%, ${GLOW} 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(37,99,235,0.10) 0%, transparent 50%), ${BG}`,
    color: TEXT,
    fontFamily: "Inter, sans-serif",
    overflowX: "hidden",
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
    padding: "16px 32px",
    backdropFilter: "blur(16px)",
    background: "rgba(12,10,26,0.75)",
    borderBottom: "1px solid rgba(124,58,237,0.1)",
  },
});

const NavButtons = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
  },
});

const Hero = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "120px 24px 80px",
    gap: "24px",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
  },
});

const HeroTitle = styled("h1", {
  base: {
    fontSize: "clamp(36px, 6vw, 64px)",
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
    fontSize: "clamp(16px, 2.5vw, 20px)",
    color: TEXT_SECONDARY,
    maxWidth: "560px",
    lineHeight: 1.6,
    margin: 0,
  },
});

const HeroCTA = styled("div", {
  base: {
    display: "flex",
    gap: "16px",
    marginTop: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});

const Features = styled("section", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "0 24px 80px",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
    animationDelay: "0.15s",
  },
});

const FeatureCard = styled("div", {
  base: {
    background: "rgba(26,23,38,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,0.15)",
    borderRadius: "16px",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    _hover: {
      borderColor: "rgba(124,58,237,0.4)",
      boxShadow: `0 4px 32px ${GLOW}`,
    },
  },
});

const FeatureIcon = styled("div", {
  base: {
    fontSize: "32px",
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background: "rgba(124,58,237,0.1)",
  },
});

const FeatureTitle = styled("h3", {
  base: {
    fontSize: "20px",
    fontWeight: 600,
    margin: 0,
    color: TEXT,
  },
});

const FeatureDesc = styled("p", {
  base: {
    fontSize: "15px",
    color: TEXT_SECONDARY,
    lineHeight: 1.6,
    margin: 0,
  },
});

const CTASection = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "60px 24px 80px",
    gap: "20px",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
    animationDelay: "0.3s",
  },
});

const CTATitle = styled("h2", {
  base: {
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 700,
    margin: 0,
  },
});

const Footer = styled("footer", {
  base: {
    textAlign: "center",
    padding: "32px 24px",
    color: TEXT_DIMMED,
    fontSize: "14px",
    borderTop: "1px solid rgba(124,58,237,0.1)",
  },
});

/* ── Buttons ───────────────────────────────────────── */

const BtnPrimary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 32px",
    borderRadius: "8px",
    fontSize: "16px",
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
  },
});

const BtnSecondary = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 32px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    textDecoration: "none",
    color: TEXT,
    background: SURFACE,
    transition: "background 0.2s",
    cursor: "pointer",
    _hover: {
      background: "rgba(35,31,51,0.8)",
    },
  },
});

/* ── Landing page ──────────────────────────────────── */

export default function LandingPage() {
  const { isLoggedIn } = useClientLifecycle();

  return (
    <Show when={!isLoggedIn()} fallback={<Navigate href="/" />}>
      <Page>
        {/* ── Navbar ── */}
        <Nav>
          <img
            src={wordmarkUrl}
            alt="PLG Voice"
            height={32}
            style={{ color: TEXT }}
          />
          <NavButtons>
            <BtnSecondary href="/login">
              <Trans>Log in</Trans>
            </BtnSecondary>
            <BtnPrimary href="/login/create">
              <Trans>Sign up</Trans>
            </BtnPrimary>
          </NavButtons>
        </Nav>

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
        <Footer>© {new Date().getFullYear()} PLG Voice</Footer>
      </Page>
    </Show>
  );
}
