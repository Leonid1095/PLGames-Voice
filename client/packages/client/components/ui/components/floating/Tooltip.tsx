import { JSX, splitProps } from "solid-js";

import { styled } from "styled-system/jsx";

import { typography } from "../design";

/**
 * Base element for the tooltip
 */
export const TooltipBase = styled("div", {
  base: {
    color: "var(--md-sys-color-inverse-on-surface)",
    background: "var(--md-sys-color-inverse-surface)",
    padding: "8px 12px",
    borderRadius: "6px",
    boxShadow: "var(--pd-shadow-float)",
    maxWidth: "240px",

    ...typography.raw({
      class: "label",
      size: "small",
    }),
  },
});

type Props = {
  /**
   * Tooltip trigger area
   */
  children: JSX.Element;
} & (JSX.Directives["floating"] & object)["tooltip"];

/**
 * Tooltip component
 */
export function Tooltip(props: Props) {
  const [local, remote] = splitProps(props, ["children"]);

  return (
    <div
      use:floating={{
        tooltip: remote as never,
      }}
    >
      {local.children}
    </div>
  );
}
