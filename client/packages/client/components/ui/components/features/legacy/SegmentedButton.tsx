import {
  type JSXElement,
  createContext,
  createUniqueId,
  useContext,
} from "solid-js";

import { cva } from "styled-system/css";

/**
 * Shared state for a segmented group. MDUI's group element coordinated its
 * children; native radios group by sharing a `name`.
 */
const SegmentContext = createContext<{
  name: string;
  value: () => string;
  required: () => boolean | undefined;
  select: (event: Event & { currentTarget: HTMLInputElement }) => void;
}>();

/**
 * @deprecated Material Expressive introduced button groups which should be used instead!
 */
export function SegmentedButton(props: {
  value: string;
  children: JSXElement;
}) {
  const ctx = useContext(SegmentContext);

  return (
    <label class={segment()}>
      <input
        type="radio"
        class={input()}
        name={ctx?.name}
        value={props.value}
        checked={ctx?.value() === props.value}
        required={ctx?.required()}
        onChange={(e) => ctx?.select(e)}
      />
      <span>{props.children}</span>
    </label>
  );
}

/**
 * @deprecated Material Expressive introduced button groups which should be used instead!
 */
export function SingleSelectSegmentedButtonGroup(props: {
  onSelect: (e: Event & { currentTarget: HTMLInputElement }) => void;
  children: JSXElement;
  value: string;
  required?: boolean;
}) {
  const name = createUniqueId();

  return (
    <SegmentContext.Provider
      value={{
        name,
        value: () => props.value,
        required: () => props.required,
        // eslint-disable-next-line solid/reactivity
        select: props.onSelect,
      }}
    >
      <div role="radiogroup" class={group()}>
        {props.children}
      </div>
    </SegmentContext.Provider>
  );
}

const group = cva({
  base: {
    display: "inline-flex",
    // One shared border for the strip; segments contribute their own divider
    // rather than doubling it up at every seam.
    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "var(--pd-radius-md)",
    overflow: "hidden",
  },
});

const segment = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--pd-space-2)",
    minHeight: "36px",
    padding: "0 var(--pd-space-4)",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "var(--pd-text-sm)",
    cursor: "pointer",
    userSelect: "none",
    transition: "background var(--pd-transition-fast), color var(--pd-transition-fast)",

    "&:not(:first-child)": {
      borderInlineStart: "1px solid var(--md-sys-color-outline-variant)",
    },
    "&:hover:not(:has(input:checked))": {
      background: "var(--md-sys-color-surface-container-high)",
    },
    "&:has(input:checked)": {
      background: "var(--md-sys-color-primary)",
      color: "var(--md-sys-color-on-primary)",
      fontWeight: "var(--pd-weight-semibold)",
    },
    "&:has(input:focus-visible)": {
      outline: "2px solid var(--md-sys-color-primary)",
      outlineOffset: "-2px",
    },
  },
});

/** The radio itself is the state; only the label is visible. */
const input = cva({
  base: {
    position: "absolute",
    width: "1px",
    height: "1px",
    opacity: 0,
    pointerEvents: "none",
  },
});
