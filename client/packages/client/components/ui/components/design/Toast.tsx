import { For, createSignal } from "solid-js";

import { styled } from "styled-system/jsx";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
let nextId = 0;

/**
 * Show a toast notification
 */
export function showToast(type: ToastType, message: string, duration = 5000) {
  const id = nextId++;
  setToasts((prev) => [...prev.slice(-2), { id, type, message, duration }]);

  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(id: number) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

const ICON_MAP: Record<ToastType, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
  warning: "warning",
};

/**
 * Toast container — renders at bottom-right
 */
export function ToastContainer() {
  return (
    <Container>
      <For each={toasts()}>
        {(toast) => (
          <ToastItem type={toast.type} onClick={() => dismissToast(toast.id)}>
            <Symbol size={20}>{ICON_MAP[toast.type]}</Symbol>
            <ToastMessage>{toast.message}</ToastMessage>
          </ToastItem>
        )}
      </For>
    </Container>
  );
}

const Container = styled("div", {
  base: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
    pointerEvents: "none",
    maxWidth: "380px",
  },
});

const ToastItem = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "12px 16px",
    borderRadius: "var(--borderRadius-md)",
    boxShadow: "var(--elevation-3)",
    cursor: "pointer",
    pointerEvents: "auto",
    animation: "toastSlideIn 0.3s cubic-bezier(0.2, 0, 0, 1)",
    transition: "var(--transitions-fast) opacity, var(--transitions-fast) transform",
    userSelect: "none",
    minWidth: "280px",

    "&:hover": {
      opacity: 0.9,
    },
  },
  variants: {
    type: {
      success: {
        background: "var(--md-sys-color-primary-container)",
        color: "var(--md-sys-color-on-primary-container)",
      },
      error: {
        background: "var(--md-sys-color-error-container)",
        color: "var(--md-sys-color-on-error-container)",
      },
      info: {
        background: "var(--md-sys-color-secondary-container)",
        color: "var(--md-sys-color-on-secondary-container)",
      },
      warning: {
        background: "var(--md-sys-color-tertiary-container)",
        color: "var(--md-sys-color-on-tertiary-container)",
      },
    },
  },
  defaultVariants: {
    type: "info",
  },
});

const ToastMessage = styled("span", {
  base: {
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.4,
  },
});
