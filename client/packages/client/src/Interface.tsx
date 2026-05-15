import { JSX, Match, Switch, createEffect, onCleanup, onMount } from "solid-js";

import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { ChannelContextMenu, ServerContextMenu, initGameActivity } from "@revolt/app";
import { CommandPalette } from "@revolt/app/interface/CommandPalette";
import { MessageCache } from "@revolt/app/interface/channels/text/MessageCache";
import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { NotificationsWorker } from "@revolt/client/NotificationsWorker";
import { useModals } from "@revolt/modal";
import { Navigate, useBeforeLeave, useLocation } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import { ToastContainer } from "@revolt/ui/components/design";
import { ScheduledMessagesWorker } from "./interface/channels/text/ScheduledMessages";
import { MobileProvider, useMobile } from "./interface/MobileContext";
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
        background: "#0B0A12",
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
            <stop offset="0%" stop-color="#A78BFA" />
            <stop offset="100%" stop-color="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          width: "100px",
          height: "2px",
          "border-radius": "1px",
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "#8B5CF6",
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

  // Streamer mode: toggle CSS class on body + Ctrl+Shift+S hotkey
  createEffect(() => {
    const streamer = state.settings.getValue("privacy:streamer_mode");
    document.body.classList.toggle("streamer-mode", !!streamer);
  });
  onMount(() => {
    const streamerHotkey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        const current = state.settings.getValue("privacy:streamer_mode");
        state.settings.setValue("privacy:streamer_mode", !current);
      }
    };
    document.addEventListener("keydown", streamerHotkey, true);
    onCleanup(() => document.removeEventListener("keydown", streamerHotkey, true));
  });

  // Initialize game activity detection on desktop
  onMount(() => {
    if (typeof window !== "undefined" && window.native) {
      const c = client();
      if (c?.user) {
        initGameActivity((status) => c.user!.edit({ status }));
      }
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
    <MobileProvider>
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
              <Navigate href="/welcome" />
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
                <MobileSidebarWrapper
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
                  data-content
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
          <ScheduledMessagesWorker />
          <ThemeSetup />
          <CommandPalette />
          <ToastContainer />
        </div>
      </MessageCache>
    </MobileProvider>
  );
};

/**
 * Mobile-aware sidebar wrapper with backdrop overlay + swipe support
 */
function MobileSidebarWrapper(props: {
  menuGenerator: (target: any) => any;
}) {
  const { isMobile, sidebarOpen, openSidebar, closeSidebar } = useMobile();
  const { pathname } = useLocation();

  // Auto-close sidebar on navigation (user tapped a channel)
  createEffect(() => {
    pathname; // track
    closeSidebar();
  });

  // Swipe-from-left-edge to open sidebar
  let touchStartX = 0;
  let touchStartY = 0;

  const onTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!isMobile()) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    // Swipe right from left edge (start < 30px, move > 60px, mostly horizontal)
    if (touchStartX < 30 && dx > 60 && dy < dx) {
      openSidebar();
    }
    // Swipe left to close (when sidebar open, move < -60px)
    if (sidebarOpen() && dx < -60 && dy < Math.abs(dx)) {
      closeSidebar();
    }
  };

  // Escape key closes sidebar
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && sidebarOpen()) {
      closeSidebar();
    }
  };

  onMount(() => {
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <>
      <div
        data-sidebar-backdrop
        role="button"
        aria-label="Close sidebar"
        tabIndex={-1}
        classList={{ "sidebar-open": sidebarOpen() }}
        onClick={closeSidebar}
      />
      <div
        data-sidebar
        role="navigation"
        aria-hidden={!sidebarOpen()}
        classList={{ "sidebar-open": sidebarOpen() }}
      >
        <Sidebar menuGenerator={props.menuGenerator} />
      </div>
    </>
  );
}

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
        color: "var(--md-sys-color-on-surface)",
        /* Flat single surface — Notion/Linear feel.
           Sidebars get their own surface-container-low background, the main
           area uses surface (slightly darker). No gradients, no shadows. */
        background: "var(--md-sys-color-surface)",
      },
    },
  },
});

/**
 * Main content container
 */
const Content = styled("div", {
  base: {
    background: "var(--md-sys-color-surface)",

    display: "flex",
    width: "100%",
    minWidth: 0,
  },
  variants: {
    sidebar: {
      false: {
        /* No floating card / rounded corners — flat from edge to edge */
      },
    },
  },
});

export default Interface;
