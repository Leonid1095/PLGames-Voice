import { JSX } from "solid-js";
import { css } from "styled-system/css";

/**
 * Fallback UI for ErrorBoundary — shows when a component crashes.
 * Provides a "Reload" button to retry rendering.
 */
export function ErrorFallback(props: {
  error: unknown;
  reset: () => void;
  label?: string;
}) {
  return (
    <div class={container()} data-testid="error-fallback">
      <span class={icon()}>&#9888;</span>
      <p class={message()}>
        {props.label ?? "Произошла ошибка при отображении"}
      </p>
      <button
        class={retryButton()}
        onClick={() => props.reset()}
        data-testid="error-retry"
      >
        Перезагрузить
      </button>
    </div>
  );
}

const container = () =>
  css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "24px",
    minHeight: "120px",
    width: "100%",
    color: "var(--md-sys-color-on-surface-variant, #aaa)",
  });

const icon = () =>
  css({
    fontSize: "32px",
    opacity: 0.6,
  });

const message = () =>
  css({
    fontSize: "14px",
    textAlign: "center",
    margin: 0,
  });

const retryButton = () =>
  css({
    padding: "8px 20px",
    borderRadius: "20px",
    border: "1px solid var(--md-sys-color-outline, #555)",
    background: "transparent",
    color: "var(--md-sys-color-primary, #7cacf8)",
    cursor: "pointer",
    fontSize: "14px",
    _hover: {
      background: "var(--md-sys-color-surface-variant, #333)",
    },
  });
