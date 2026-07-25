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
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    /* Glass-bg with type-coloured slice on the left (via inset border) */
    background: "var(--qp-glass-bg, color-mix(in srgb, var(--md-sys-color-surface) 80%, transparent))",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
    border: "1px solid var(--pd-border-default)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.40)",
    cursor: "pointer",
    pointerEvents: "auto",
    animation: "toastSlideIn 0.3s cubic-bezier(0.2, 0, 0, 1)",
    transition: "opacity 140ms cubic-bezier(0.2,0,0,1), transform 140ms cubic-bezier(0.2,0,0,1)",
    userSelect: "none",
    minWidth: "300px",
    color: "var(--md-sys-color-on-surface)",

    "&:hover": {
      opacity: 0.92,
    },
  },
  variants: {
    type: {
      success: {
        boxShadow: "0 12px 32px rgba(0,0,0,0.40), inset 3px 0 0 var(--brand-presence-online)",
        "& svg": { color: "var(--brand-presence-online)" },
      },
      error: {
        boxShadow: "0 12px 32px rgba(0,0,0,0.40), inset 3px 0 0 var(--brand-presence-busy)",
        "& svg": { color: "var(--brand-presence-busy)" },
      },
      info: {
        boxShadow: "0 12px 32px rgba(0,0,0,0.40), inset 3px 0 0 var(--md-sys-color-primary)",
        "& svg": { color: "var(--md-sys-color-primary)" },
      },
      warning: {
        boxShadow: "0 12px 32px rgba(0,0,0,0.40), inset 3px 0 0 var(--brand-presence-idle)",
        "& svg": { color: "var(--brand-presence-idle)" },
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
    letterSpacing: "-0.005em",
    lineHeight: 1.4,
    color: "var(--md-sys-color-on-surface)",
  },
});
