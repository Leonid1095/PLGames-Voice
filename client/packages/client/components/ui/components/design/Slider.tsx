import { type JSX, splitProps } from "solid-js";

import { css } from "styled-system/css";

type Props = Omit<
  JSX.HTMLAttributes<HTMLInputElement>,
  "onChange" | "onInput"
> & {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  tickmarks?: boolean;
  labelFormatter?: (value: number) => string;
  onChange?: (event: { currentTarget: { value: number } }) => void;
  onInput?: (event: { currentTarget: { value: number } }) => void;
};

/**
 * Sliders let users make selections from a range of values.
 *
 * Native range input rather than an MDUI web component. MDUI showed the current
 * value in a floating bubble that only appeared while dragging; the value is
 * now printed beside the track, where it can be read before you touch anything
 * — which is what matters for settings like mic sensitivity.
 *
 * `labelFormatter` keeps its meaning and formats that readout.
 */
export function Slider(props: Props) {
  const [local, rest] = splitProps(props, [
    "labelFormatter",
    "tickmarks",
    "value",
    "onChange",
    "onInput",
    "class",
  ]);

  const format = (v: number) => local.labelFormatter?.(v) ?? String(v);
  const listId = `${rest.id ?? "slider"}-ticks`;

  return (
    <div class={wrapper()}>
      <input
        type="range"
        {...rest}
        class={`${track()} ${local.class ?? ""}`}
        value={local.value}
        list={local.tickmarks ? listId : undefined}
        onInput={(e) =>
          local.onInput?.({
            currentTarget: { value: e.currentTarget.valueAsNumber },
          })
        }
        onChange={(e) =>
          local.onChange?.({
            currentTarget: { value: e.currentTarget.valueAsNumber },
          })
        }
      />
      <output class={readout()}>{format(local.value)}</output>
    </div>
  );
}

const wrapper = () =>
  css({
    display: "flex",
    alignItems: "center",
    gap: "var(--pd-space-3)",
    width: "100%",
  });

const track = () =>
  css({
    flex: 1,
    minWidth: 0,
    height: "var(--pd-touch-target)",
    margin: 0,
    accentColor: "var(--md-sys-color-primary)",
    cursor: "pointer",
    "&:disabled": { opacity: 0.5, cursor: "default" },
  });

const readout = () =>
  css({
    flex: "none",
    minWidth: "4ch",
    textAlign: "end",
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-sm)",
    // Tabular so the track does not shift as the number changes width.
    fontVariantNumeric: "tabular-nums",
    color: "var(--md-sys-color-on-surface-variant)",
  });
