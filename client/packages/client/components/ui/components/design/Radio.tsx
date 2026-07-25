import { JSX, createContext, createUniqueId, useContext } from "solid-js";

import { css } from "styled-system/css";

interface GroupProps {
  value?: string;
  onChange?: (event: { currentTarget: { value: string } }) => void;
  required?: boolean;
  disabled?: boolean;
  children?: JSX.Element;
}

interface Props {
  value?: string;
  children?: JSX.Element;
}

/**
 * Shared state for a radio group.
 *
 * MDUI's <mdui-radio-group> coordinated its children internally. Native inputs
 * group by sharing a `name`, so the group hands one down along with the current
 * value and the change handler.
 */
const RadioContext = createContext<{
  name: string;
  value: () => string | undefined;
  disabled: () => boolean | undefined;
  required: () => boolean | undefined;
  select: (value: string) => void;
}>();

/**
 * Radio buttons let people select one option from a set of options.
 *
 * Native inputs rather than MDUI web components: arrow-key navigation within a
 * group, form participation and screen-reader semantics are all built into the
 * platform control, and the visual side is themeable with one accent-color
 * declaration instead of custom properties aimed at a closed shadow DOM.
 */
export function Radio2(props: GroupProps) {
  const name = createUniqueId();

  return (
    <RadioContext.Provider
      value={{
        name,
        value: () => props.value,
        disabled: () => props.disabled,
        required: () => props.required,
        select: (value) => props.onChange?.({ currentTarget: { value } }),
      }}
    >
      <div role="radiogroup" class={group()}>
        {props.children}
      </div>
    </RadioContext.Provider>
  );
}

/**
 * One option within a Radio2 group.
 */
Radio2.Option = function Option(props: Props) {
  const ctx = useContext(RadioContext);

  return (
    <label class={option()}>
      <input
        type="radio"
        class={dot()}
        name={ctx?.name}
        value={props.value}
        checked={ctx?.value() === props.value}
        disabled={ctx?.disabled()}
        required={ctx?.required()}
        onChange={() => props.value !== undefined && ctx?.select(props.value)}
      />
      {props.children}
    </label>
  );
};

const group = () =>
  css({
    display: "flex",
    flexDirection: "column",
    gap: "var(--pd-space-2)",
  });

const option = () =>
  css({
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--pd-space-2)",
    cursor: "pointer",
    userSelect: "none",
    "&:has(input:disabled)": { cursor: "default", opacity: 0.5 },
  });

const dot = () =>
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
