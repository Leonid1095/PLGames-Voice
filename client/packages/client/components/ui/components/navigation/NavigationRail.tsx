import {
  Accessor,
  JSXElement,
  Setter,
  createContext,
  useContext,
} from "solid-js";

import { cva } from "styled-system/css";

interface Props {
  children: JSXElement;
  contained?: boolean;
  value: Accessor<string>;
  onValue: Setter<string>;
}

/**
 * Shared state for the rail. MDUI's <mdui-navigation-rail> coordinated its
 * children internally; native buttons need the current value and the setter
 * handed down.
 */
const RailContext = createContext<{
  value: () => string;
  select: (value: string) => void;
}>();

/**
 * Navigation rails let people switch between UI views on mid-sized devices.
 *
 * Native nav + buttons rather than MDUI web components. `aria-current` marks
 * the active view, which the custom element never exposed.
 */
export function NavigationRail(props: Props) {
  return (
    <RailContext.Provider
      value={{
        value: () => props.value(),
        select: (value) => props.onValue(value as never),
      }}
    >
      <nav class={rail({ contained: props.contained })}>{props.children}</nav>
    </RailContext.Provider>
  );
}

const rail = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--pd-space-1)",
    paddingBlock: "var(--pd-space-2)",
    width: "56px",
    flex: "none",
    background: "transparent",
  },
  variants: {
    contained: {
      true: {
        background: "var(--md-sys-color-surface-container)",
      },
    },
  },
});

interface ItemProps {
  value: string;
  icon: JSXElement;
  children: JSXElement;
}

/**
 * An item used in the navigation rail.
 */
function NavigationRailItem(props: ItemProps) {
  const ctx = useContext(RailContext);
  const active = () => ctx?.value() === props.value;

  return (
    <button
      type="button"
      class={item()}
      aria-current={active() ? "page" : undefined}
      onClick={() => ctx?.select(props.value)}
    >
      <span class={icon({ active: active() })}>{props.icon}</span>
      <span class={caption()}>{props.children}</span>
    </button>
  );
}

NavigationRail.Item = NavigationRailItem;

const item = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    width: "100%",
    padding: "var(--pd-space-1) 0",
    border: "none",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    font: "inherit",
    cursor: "pointer",
    borderRadius: "var(--pd-radius-sm)",
    transition: "color var(--pd-transition-fast)",
    "&[aria-current]": { color: "var(--md-sys-color-on-surface)" },
    "&:hover": { color: "var(--md-sys-color-on-surface)" },
  },
});

const icon = cva({
  base: {
    display: "grid",
    placeItems: "center",
    width: "32px",
    height: "32px",
    borderRadius: "var(--pd-radius-pill)",
    fill: "currentColor",
    transition: "background var(--pd-transition-fast)",
  },
  variants: {
    active: {
      true: {
        background: "var(--md-sys-color-surface-container-highest)",
        color: "var(--md-sys-color-primary)",
      },
    },
  },
});

const caption = cva({
  base: {
    fontSize: "var(--pd-text-xs)",
    lineHeight: 1.2,
    textAlign: "center",
  },
});
