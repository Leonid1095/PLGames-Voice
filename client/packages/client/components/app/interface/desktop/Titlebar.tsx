import { Match, Show, Switch, createSignal } from "solid-js";
import { Motion, Presence } from "solid-motionone";

import { Trans } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { Button, Ripple, symbolSize, typography } from "@revolt/ui";

import { Maximize2 as MdExpandContent, Minimize2 as MdCollapseContent, Minus as MdMinimize, Wrench as MdBuild, X as MdClose } from "lucide-solid";

import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";
import { pendingUpdate } from "../../../../src/serviceWorkerInterface";

export function Titlebar() {
  const [isMaximised, setIsMaximised] = createSignal(
    window.native ? window.desktopConfig.get().windowState.isMaximised : false,
  );
  const { lifecycle } = useClientLifecycle();

  function isDisconnected() {
    return [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state());
  }

  function maximise() {
    window.native.maximise();
    setIsMaximised((t) => !t);
  }

  return (
    <Presence>
      <Show
        when={
          (window.native && window.desktopConfig?.get().customFrame) ||
          isDisconnected() ||
          // Without this the update prompt was unreachable in a browser: the
          // service worker sets pendingUpdate, but the only UI that offers it
          // is this bar, which otherwise appears solely for the desktop custom
          // frame or while disconnected. Browser users stayed on the old bundle
          // until they happened to reload — which is how a redesign can ship
          // and nobody sees it.
          !!pendingUpdate()
        }
      >
        <Motion.div
          initial={{ height: 0 }}
          animate={{ height: "29px" }}
          exit={{ height: 0 }}
        >
          <Base disconnected={isDisconnected()}>
            <Title
              style={{
                "-webkit-user-select": "none",
                "-webkit-app-region": "drag",
              }}
            >
              <Wordmark
                class={css({
                  height: "18px",
                  marginBlockStart: "1px",
                })}
              />{" "}
              <Show when={import.meta.env.DEV}>
                <MdBuild {...symbolSize(16)} />
              </Show>
            </Title>
            <DragHandle
              style={{
                "-webkit-user-select": "none",
                "-webkit-app-region": "drag",
              }}
            >
              <Switch>
                <Match when={lifecycle.state() === State.Connecting}>
                  <Trans>Connecting</Trans>
                </Match>
                {/* <Match when={lifecycle.state() === State.Connected}>Connected</Match> */}
                <Match when={lifecycle.state() === State.Disconnected}>
                  <Trans>Disconnected</Trans>
                  <a
                    onClick={() =>
                      lifecycle.transition({
                        type: TransitionType.Retry,
                      })
                    }
                  >
                    <strong>
                      {" "}
                      <Trans>(reconnect now)</Trans>
                    </strong>
                  </a>
                </Match>
                <Match when={lifecycle.state() === State.Reconnecting}>
                  <Trans>Reconnecting</Trans>
                </Match>
                <Match when={lifecycle.state() === State.Offline}>
                  <Trans>Device is offline</Trans>
                  <a
                    onClick={() =>
                      lifecycle.transition({
                        type: TransitionType.Retry,
                      })
                    }
                    style={{
                      "-webkit-app-region": "no-drag",
                    }}
                  >
                    <strong>
                      {" "}
                      <Trans>(reconnect now)</Trans>
                    </strong>
                  </a>
                </Match>
                {/* Last, so a connection problem still takes the bar. */}
                <Match when={pendingUpdate()}>
                  <Trans>A new version is available</Trans>
                </Match>
              </Switch>
              <Show when={pendingUpdate()}>
                {" "}
                <div
                  style={{
                    "-webkit-app-region": "no-drag",
                  }}
                >
                  <Button size="sm" onPress={pendingUpdate()}>
                    <Trans>Update</Trans>
                  </Button>
                </div>
              </Show>
            </DragHandle>
            <Show when={window.native}>
              <Action onClick={window.native.minimise}>
                <Ripple />
                <MdMinimize {...symbolSize(20)} />
              </Action>
              <Action onClick={maximise}>
                <Ripple />
                <Show
                  when={isMaximised()}
                  fallback={<MdExpandContent {...symbolSize(20)} />}
                >
                  <MdCollapseContent {...symbolSize(20)} />
                </Show>
              </Action>
              <Action onClick={window.native.close}>
                <Ripple />
                <MdClose {...symbolSize(20)} />
              </Action>
            </Show>
          </Base>
        </Motion.div>
      </Show>
    </Presence>
  );
}

const Base = styled("div", {
  base: {
    flexShrink: 0,
    height: "29px",
    userSelect: "none",

    display: "flex",
    alignItems: "center",

    fill: "var(--md-sys-color-on-surface)",
  },
  variants: {
    disconnected: {
      true: {
        color: "var(--pd-warn)",
        background: "var(--md-sys-color-surface-container-high)",
        "& a": { color: "var(--md-sys-color-primary)", cursor: "pointer" },
      },
      false: {
        color: "var(--md-sys-color-outline)",
        background: "var(--md-sys-color-surface-container-high)",
      },
    },
  },
});

const Title = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    paddingInlineStart: "var(--gap-md)",

    color: "var(--md-sys-color-on-surface)",
    ...typography.raw({ class: "title", size: "small" }),
  },
});

const DragHandle = styled("div", {
  base: {
    flexGrow: 1,
    height: "100%",

    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    paddingInlineStart: "var(--gap-md)",

    ...typography.raw({ class: "label", size: "large" }),
  },
});

const Action = styled("a", {
  base: {
    cursor: "pointer",
    position: "relative",

    display: "grid",
    placeItems: "center",

    height: "100%",
    aspectRatio: "3/2",
  },
});
