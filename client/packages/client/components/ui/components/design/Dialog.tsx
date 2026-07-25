import type { JSX } from "solid-js";
import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { styled } from "styled-system/jsx";

import { Button } from "./Button";
import { typography } from "./Text";

export interface DialogProps {
  show: boolean;
  onClose: () => void;
}

export interface DialogAction {
  text: JSX.Element;
  onClick?: () => void | Promise<unknown> | true | false;
  isDisabled?: boolean;
}

type Props = DialogProps & {
  icon?: JSX.Element;
  title?: JSX.Element;
  children: JSX.Element;
  actions?: DialogAction[];
  isDisabled?: boolean;

  scrimBackground?: string;

  minWidth?: number;
  padding?: number;
};

/**
 * Dialogs provide important prompts in a user flow
 *
 * @specification https://m3.material.io/components/dialogs
 */
export function Dialog(props: Props) {
  return (
    <Portal mount={document.getElementById("floating")!}>
      <Dialog.Scrim
        show={props.show}
        onClick={props.onClose}
        style={{
          "--background": props.scrimBackground
            ? `url('${props.scrimBackground}'), rgba(0, 0, 0, 0.85)`
            : "rgba(0, 0, 0, 0.85)",
        }}
      >
        <Presence>
          <Show when={props.show}>
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.2, easing: [0.16, 1, 0.3, 1] }}
            >
              <Container
                style={{
                  "min-width": props.minWidth
                    ? `${props.minWidth}px`
                    : undefined,
                  padding: props.padding ? `${props.padding}px` : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Show when={props.icon}>
                  <Icon>{props.icon}</Icon>
                </Show>
                <Show when={props.title}>
                  <Title withIcon={typeof props.icon !== "undefined"}>
                    {props.title}
                  </Title>
                </Show>
                <Content class={typography()}>{props.children}</Content>
                <Show when={props.actions}>
                  <Actions>
                    <For each={props.actions}>
                      {(action) => (
                        <Button
                          variant="text"
                          size="small"
                          onPress={() => {
                            if (action.isDisabled) return;

                            const value: unknown = action.onClick?.();
                            if (value instanceof Promise) {
                              value.then(props.onClose).catch(() => {});
                            } else if (value !== false) {
                              props.onClose();
                            }
                          }}
                          isDisabled={action.isDisabled || props.isDisabled}
                        >
                          {action.text}
                        </Button>
                      )}
                    </For>
                  </Actions>
                </Show>
              </Container>
            </Motion.div>
          </Show>
        </Presence>
      </Dialog.Scrim>
    </Portal>
  );
}

/**
 * Full-screen scrim shown below dialogs
 *
 * @specification https://m3.material.io/components/dialogs
 */
Dialog.Scrim = styled("div", {
  base: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: "fixed",
    zIndex: "100",

    maxHeight: "100%",

    display: "grid",
    userSelect: "none",
    placeItems: "center",

    pointerEvents: "all",

    animationName: "scrimFadeIn",
    animationDuration: "0.15s",
    animationFillMode: "forwards",
    transition: "var(--transitions-medium) all",
  },
  variants: {
    show: {
      false: {
        animationName: "unset",
        pointerEvents: "none",
        background: "transparent",
      },
    },
    padding: {
      true: {
        padding: "80px",
      },
    },
    overflow: {
      true: {
        overflowY: "auto",
      },
    },
    dark: {
      true: {
        "--background": "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      },
      false: {
        "--background": "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      },
    },
  },
  defaultVariants: {
    show: true,
    padding: true,
    overflow: true,
    dark: false,
  },
});

const Container = styled("div", {
  base: {
    padding: "0",
    minWidth: "320px",
    maxWidth: "440px",
    borderRadius: "14px",
    overflow: "hidden",

    display: "flex",
    flexDirection: "column",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-low)",
    border: "1px solid var(--pd-border-default)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.30)",
    animation: "modalIn 220ms cubic-bezier(0.05, 0.7, 0.1, 1)",
  },
});

const Icon = styled("div", {
  base: {
    alignSelf: "center",
    padding: "24px 24px 0",
    fill: "var(--md-sys-color-on-surface)",
  },
});

const Title = styled("span", {
  base: {
    ...typography.raw({ class: "headline", size: "small" }),
    padding: "24px 24px 0",
  },
  variants: {
    withIcon: {
      true: {
        textAlign: "center",
        paddingTop: "16px",
      },
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

const Content = styled("div", {
  base: {
    padding: "16px 24px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const Actions = styled("div", {
  base: {
    gap: "8px",
    display: "flex",
    justifyContent: "end",
    padding: "12px 24px",
    background: "var(--md-sys-color-surface-container)",
    borderTop: "1px solid var(--pd-border-subtle)",
  },
});
