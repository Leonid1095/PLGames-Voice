import { JSX, Match, Switch, createEffect } from "solid-js";

import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { ChannelContextMenu, ServerContextMenu } from "@revolt/app";
import { MessageCache } from "@revolt/app/interface/channels/text/MessageCache";
import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { NotificationsWorker } from "@revolt/client/NotificationsWorker";
import { useModals } from "@revolt/modal";
import { Navigate, useBeforeLeave, useLocation } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import { Sidebar } from "./interface/Sidebar";
import { ThemeSetup } from "./interface/ThemeSetup";

/**
 * Branded loading screen — shown while the client initializes
 */
function AppLoader() {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        gap: "20px",
        flex: "1",
        background: "#0C0A1A",
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "splashPulse 2s ease-in-out infinite" }}
      >
        <path
          d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
          fill="url(#lg)"
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
          <linearGradient id="lg" x1="4" y1="2" x2="28" y2="30">
            <stop offset="0%" stop-color="#7C3AED" />
            <stop offset="100%" stop-color="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          width: "100px",
          height: "2px",
          "border-radius": "1px",
          background: "#231F33",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "linear-gradient(90deg, #7C3AED, #2563EB)",
            "border-radius": "1px",
            animation: "splashLoad 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Application layout
 */
const Interface = (props: { children: JSX.Element }) => {
  const state = useState();
  const client = useClient();
  const { openModal } = useModals();
  const { isLoggedIn, lifecycle } = useClientLifecycle();
  const { pathname } = useLocation();

  useBeforeLeave((e) => {
    if (!e.defaultPrevented) {
      if (e.to === "/settings") {
        e.preventDefault();
        openModal({
          type: "settings",
          config: "user",
        });
      } else if (typeof e.to === "string") {
        state.layout.setLastActivePath(e.to);
      }
    }
  });

  createEffect(() => {
    if (!isLoggedIn()) {
      state.layout.setNextPath(pathname);
    }
  });

  function isDisconnected() {
    return [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state());
  }

  return (
    <MessageCache client={client()}>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "100%",
        }}
      >
        <Switch fallback={<AppLoader />}>
          <Match when={!isLoggedIn()}>
            <Navigate href="/login" />
          </Match>
          <Match when={lifecycle.loadedOnce()}>
            <Titlebar />
            <Layout
              disconnected={isDisconnected()}
              style={{ "flex-grow": 1, "min-height": 0 }}
              onDragOver={(e) => {
                if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
              }}
              onDrop={(e) => e.preventDefault()}
            >
              <Sidebar
                menuGenerator={(target) => ({
                  contextMenu: () => {
                    return (
                      <>
                        {target instanceof Server ? (
                          <ServerContextMenu server={target} />
                        ) : (
                          <ChannelContextMenu channel={target} />
                        )}
                      </>
                    );
                  },
                })}
              />
              <Content
                sidebar={state.layout.getSectionState(
                  LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
                  true,
                )}
              >
                {props.children}
              </Content>
            </Layout>
          </Match>
        </Switch>

        <NotificationsWorker />
        <ThemeSetup />
      </div>
    </MessageCache>
  );
};

/**
 * Parent container
 */
const Layout = styled("div", {
  base: {
    display: "flex",
    height: "100%",
    minWidth: 0,
  },
  variants: {
    disconnected: {
      true: {
        color: "var(--md-sys-color-on-primary-container)",
        background: "var(--md-sys-color-primary-container)",
      },
      false: {
        color: "var(--md-sys-color-outline)",
        background: "radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent) 0%, transparent 50%), linear-gradient(135deg, var(--md-sys-color-surface-container-high) 0%, color-mix(in srgb, var(--md-sys-color-surface-container) 70%, var(--md-sys-color-surface-container-high)) 100%)",
      },
    },
  },
});

/**
 * Main content container
 */
const Content = styled("div", {
  base: {
    background: "color-mix(in srgb, var(--md-sys-color-surface-container-low) 85%, transparent)",
    backdropFilter: "blur(8px)",
    boxShadow: "inset 1px 0 0 color-mix(in srgb, var(--md-sys-color-outline-variant) 15%, transparent)",

    display: "flex",
    width: "100%",
    minWidth: 0,
  },
  variants: {
    sidebar: {
      false: {
        borderTopLeftRadius: "var(--borderRadius-lg)",
        borderBottomLeftRadius: "var(--borderRadius-lg)",
        overflow: "hidden",
        boxShadow: "var(--elevation-2), inset 1px 0 0 color-mix(in srgb, var(--md-sys-color-outline-variant) 15%, transparent)",
      },
    },
  },
});

export default Interface;
