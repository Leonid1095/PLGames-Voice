import { createEffect } from "solid-js";
import type { JSX } from "solid-js";

import { css } from "styled-system/css";

type Props = {
  children?: JSX.Element;
  required?: boolean;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  class?: string;
  onChange?: (event: { currentTarget: { checked: boolean } }) => void;
};

/**
 * Checkboxes let users select one or more items from a list, or turn an item
 * on or off.
 *
 * Native input rather than an MDUI web component: MDUI renders into a closed
 * shadow DOM, so its appearance could only be reached through custom-property
 * hacks, and it dragged a whole Material component library along for a control
 * the platform already provides. accent-color themes it in one line and keyboard
 * and screen-reader behaviour comes for free.
 */
export function Checkbox(props: Props) {
  let ref!: HTMLInputElement;

  // indeterminate is a DOM property with no matching attribute, so it has to be
  // assigned rather than passed through JSX.
  createEffect(() => {
    ref.indeterminate = props.indeterminate ?? false;
  });

  return (
    <label class={wrapper()}>
      <input
        ref={ref}
        type="checkbox"
        class={`${box()} ${props.class ?? ""}`}
        name={props.name}
        required={props.required}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange?.(e)}
      />
      {props.children}
    </label>
  );
}

const wrapper = () =>
  css({
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--pd-space-2)",
    cursor: "pointer",
    userSelect: "none",
    "&:has(input:disabled)": { cursor: "default", opacity: 0.5 },
  });

const box = () =>
  css({
    width: "18px",
    height: "18px",
    margin: 0,
    flex: "none",
    cursor: "inherit",
    accentColor: "var(--md-sys-color-primary)",
    transition: "transform var(--pd-transition-fast)",
    "&:active:not(:disabled)": { transform: "scale(0.92)" },
  });
