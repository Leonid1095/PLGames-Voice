import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { TransitionType } from "@revolt/client/Controller";
import { Navigate } from "@revolt/routing";
import { Button, Column } from "@revolt/ui";

import { useState } from "@revolt/state";
import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";

import MdMic from "@material-design-icons/svg/filled/mic.svg?component-solid";
import MdChat from "@material-design-icons/svg/filled/chat.svg?component-solid";
import MdGroup from "@material-design-icons/svg/filled/group.svg?component-solid";

/* ── styled primitives ──────────────────────────────── */

const Page = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    color: "var(--md-sys-color-on-surface)",
    overflowY: "auto",
    scrollbar: "hidden",
  },
});

const Navbar = styled("nav", {
  base: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    backdropFilter: "blur(12px)",
    background:
      "color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent)",
    borderBottom:
      "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 15%, transparent)",

    mdDown: {
      padding: "12px 16px",
    },
  },
});

const Hero = styled("section", {
  base: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "80px 24px 40px",
    gap: "24px",

    animationName: "contentFadeIn",
    animationDuration: "0.6s",
    animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    animationFillMode: "both",

    mdDown: {
      padding: "48px 16px 32px",
    },
  },
});

const Subtitle = styled("p", {
  base: {
    fontSize: "1.15rem",
    opacity: 0.7,
    maxWidth: "420px",
    lineHeight: 1.5,

    mdDown: {
      fontSize: "1rem",
    },
  },
});

const CTARow = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});

const Features = styled("section", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    padding: "0 48px 48px",
    maxWidth: "900px",
    marginInline: "auto",
    width: "100%",

    mdDown: {
      gridTemplateColumns: "1fr",
      padding: "0 20px 32px",
    },
  },
});

const FeatureCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "28px 20px",
    borderRadius: "20px",
    textAlign: "center",

    background:
      "color-mix(in srgb, var(--md-sys-color-surface-container) 60%, transparent)",
    backdropFilter: "blur(16px)",
    border:
      "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent)",
    boxShadow: "var(--elevation-1)",

    animationName: "contentFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    animationFillMode: "both",
  },
});

const FeatureIcon = styled("div", {
  base: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)",
    color: "var(--md-sys-color-primary)",
  },
});

const FeatureTitle = styled("span", {
  base: {
    fontWeight: 700,
    fontSize: "1rem",
  },
});

const FeatureDesc = styled("span", {
  base: {
    fontSize: "0.85rem",
    opacity: 0.6,
    lineHeight: 1.4,
  },
});

const Footer = styled("footer", {
  base: {
    textAlign: "center",
    padding: "20px",
    fontSize: "0.8rem",
    opacity: 0.4,
  },
});

/* ── component ──────────────────────────────────────── */

export default function FlowHome() {
  const state = useState();
  const { lifecycle, isLoggedIn, isError } = useClientLifecycle();

  return (
    <Switch
      fallback={
        <>
          <Show when={isLoggedIn()}>
            <Navigate href={state.layout.popNextPath() ?? "/app"} />
          </Show>

          <Page>
            {/* Navbar */}
            <Navbar>
              <Wordmark
                class={css({
                  height: "24px",
                  fill: "var(--md-sys-color-on-surface)",
                })}
              />
              <a href="/login/auth">
                <Button variant="tonal" size="small">
                  <Trans>Log In</Trans>
                </Button>
              </a>
            </Navbar>

            {/* Hero */}
            <Hero>
              <Wordmark
                class={css({
                  width: "min(280px, 60vw)",
                  fill: "var(--md-sys-color-on-surface)",
                })}
              />
              <Subtitle>
                <Trans>
                  Chat with friends. Voice, text, community.
                </Trans>
              </Subtitle>
              <CTARow>
                <a href="/login/auth">
                  <Button>
                    <Trans>Open PLG Voice</Trans>
                  </Button>
                </a>
                <a href="/login/create">
                  <Button variant="tonal">
                    <Trans>Sign Up</Trans>
                  </Button>
                </a>
              </CTARow>
            </Hero>

            {/* Features */}
            <Features>
              <FeatureCard style={{ "animation-delay": "0.1s" }}>
                <FeatureIcon>
                  <MdMic width="24" height="24" />
                </FeatureIcon>
                <FeatureTitle>
                  <Trans>Voice</Trans>
                </FeatureTitle>
                <FeatureDesc>
                  <Trans>
                    Crystal clear voice channels for your group
                  </Trans>
                </FeatureDesc>
              </FeatureCard>

              <FeatureCard style={{ "animation-delay": "0.2s" }}>
                <FeatureIcon>
                  <MdChat width="24" height="24" />
                </FeatureIcon>
                <FeatureTitle>
                  <Trans>Text</Trans>
                </FeatureTitle>
                <FeatureDesc>
                  <Trans>
                    Messaging with rich formatting and media
                  </Trans>
                </FeatureDesc>
              </FeatureCard>

              <FeatureCard style={{ "animation-delay": "0.3s" }}>
                <FeatureIcon>
                  <MdGroup width="24" height="24" />
                </FeatureIcon>
                <FeatureTitle>
                  <Trans>Servers</Trans>
                </FeatureTitle>
                <FeatureDesc>
                  <Trans>
                    Create communities and manage your space
                  </Trans>
                </FeatureDesc>
              </FeatureCard>
            </Features>

            {/* Footer */}
            <Footer>&copy; 2026 PLG Voice</Footer>
          </Page>
        </>
      }
    >
      <Match when={isError()}>
        <Page>
          <Hero>
            <Switch fallback={"an unknown error occurred"}>
              <Match when={lifecycle.permanentError === "InvalidSession"}>
                <h1>
                  <Trans>You were logged out!</Trans>
                </h1>
              </Match>
            </Switch>

            <Button
              variant="filled"
              onPress={() =>
                lifecycle.transition({
                  type: TransitionType.Dismiss,
                })
              }
            >
              <Trans>OK</Trans>
            </Button>
          </Hero>
        </Page>
      </Match>
    </Switch>
  );
}
