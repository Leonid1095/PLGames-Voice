import { ArrowUpRight, ChevronDown, ChevronRight, Copy } from "lucide-solid";
import {
  ComponentProps,
  For,
  JSX,
  Match,
  Show,
  Switch,
  createSignal,
  splitProps,
} from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { OverflowingText, iconSize } from "../utils";

import { Ripple } from "./Ripple";
import { typography } from "./Text";

/**
 * Permissible actions
 */
type Action =
  | "chevron"
  | "collapse"
  | "external"
  | "edit"
  | "copy"
  | JSX.Element;

export interface Props {
  readonly icon?: JSX.Element | "blank";
  readonly children?: JSX.Element;
  readonly description?: JSX.Element;

  readonly disabled?: boolean;
  readonly onClick?: () => void;
  readonly action?: Action | Action[];

  readonly roundedIcon?: boolean;

  readonly variant?: "filled" | "tonal" | "tertiary";
}

/**
 * Category Button
 *
 * @specification none
 */
export function CategoryButton(props: Props) {
  return (
    <Base
      variant={props.variant}
      isLink={!!props.onClick}
      disabled={props.disabled}
      aria-disabled={props.disabled}
      onClick={props.disabled ? undefined : props.onClick}
    >
      <Ripple />

      <Show when={props.icon !== "blank"}>
        <IconWrapper rounded={props.roundedIcon}>{props.icon}</IconWrapper>
      </Show>

      <Show when={props.icon === "blank"}>
        <BlankIconWrapper />
      </Show>

      <Content>
        <Show when={props.children}>
          <OverflowingText>{props.children}</OverflowingText>
        </Show>
        <Show when={props.description}>
          <Description>{props.description}</Description>
        </Show>
      </Content>
      <For each={Array.isArray(props.action) ? props.action : [props.action]}>
        {(action) => (
          <Switch fallback={action}>
            <Match when={action === "chevron"}>
              <Action>
                <ChevronRight {...iconSize(18)} />
              </Action>
            </Match>
            <Match when={action === "collapse"}>
              <Action>
                <ChevronDown {...iconSize(18)} />
              </Action>
            </Match>
            <Match when={action === "external"}>
              <Action>
                <ArrowUpRight {...iconSize(18)} />
              </Action>
            </Match>
            <Match when={action === "copy"}>
              <Action>
                <Copy {...iconSize(18)} />
              </Action>
            </Match>
          </Switch>
        )}
      </For>
    </Base>
  );
}

/**
 * Base container for button
 */
const Base = styled("a", {
  base: {
    // for <Ripple />:
    position: "relative",

    gap: "16px",
    padding: "12px 18px",
    borderRadius: "var(--pd-radius-md)",
    border: "1px solid var(--pd-border-subtle)",

    userSelect: "none",
    cursor: "pointer",
    transition: "background-color var(--pd-transition-base), border-color var(--pd-transition-base), transform var(--pd-transition-fast)",

    display: "flex",
    alignItems: "center",
    flexDirection: "row",

    color: "var(--color)",
    fill: "var(--color)",

    _hover: {
      borderColor: "var(--pd-border-default)",
    },
    _active: {
      transform: "scale(0.995)",
    },
  },
  variants: {
    variant: {
      filled: {
        /* Flat, like the filled Button. The inset white line and the white
           border were a dark-theme gloss: on paper white-over-white is
           invisible, and on the accent it read as a plastic bubble. */
        background: "var(--md-sys-color-primary)",
        "--color": "var(--md-sys-color-on-primary)",
        borderColor: "var(--md-sys-color-primary)",
        _hover: {
          background: "color-mix(in srgb, var(--md-sys-color-primary) 86%, #000)",
          borderColor: "color-mix(in srgb, var(--md-sys-color-primary) 86%, #000)",
        },
      },
      tonal: {
        background: "var(--md-sys-color-surface-container-low)",
        "--color": "var(--md-sys-color-on-surface)",
        _hover: {
          background: "var(--md-sys-color-surface-container)",
        },
      },
      tertiary: {
        background: "color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)",
        borderColor: "color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent)",
        "--color": "var(--md-sys-color-on-surface)",
        _hover: {
          background: "color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)",
        },
      },
    },
    isLink: {
      true: {
        cursor: "pointer",
      },
      false: {
        cursor: "initial",
      },
    },
    disabled: {
      true: {
        cursor: "not-allowed",
      },
    },
  },
  defaultVariants: {
    variant: "tonal",
  },
});

/**
 * Title and description styles
 */
const Content = styled("div", {
  base: {
    display: "flex",
    flexGrow: 1,
    flexDirection: "column",

    fontWeight: "var(--pd-weight-semibold)",
    fontSize: "14px",
    gap: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

/**
 * Accented wrapper for the category button icons
 */
const IconWrapper = styled("div", {
  base: {
    /* A slot, not a badge. The tinted disc behind every icon turned each row
       into a pale pink blob and gave twenty-two settings screens the same
       visual weight regardless of what the row did. The box stays, because
       avatars, emoji and role swatches are passed in here too and need a
       fixed column to line up in; only the chrome is gone. */
    color: "var(--md-sys-color-on-surface-variant)",
    fill: "var(--md-sys-color-on-surface-variant)",
    background: "transparent",

    width: "40px",
    height: "40px",
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  variants: {
    rounded: {
      true: {
        borderRadius: "50%",
      },
      false: {
        borderRadius: "var(--pd-radius-md)",
      },
    },
  },
  defaultVariants: {
    rounded: true,
  },
});

/**
 * Category button icon wrapper for the blank state
 */
const BlankIconWrapper = styled(IconWrapper, {
  base: {
    background: "transparent",
  },
});

/**
 * Description shown below title
 */
const Description = styled("span", {
  base: {
    ...typography.raw({ class: "body", size: "small" }),

    color: "var(--md-sys-color-on-surface-variant)",
    /* A settings description is a sentence, not a caption. Measure it like
       one -- an unbounded line across the full pane loses the eye on the way
       back to the next line. */
    maxWidth: "60ch",
    textWrap: "wrap",

    "& a:hover": {
      textDecoration: "underline",
    },
  },
});

/**
 * Container for action icons
 */
const Action = styled("div", {
  base: {
    width: "24px",
    height: "24px",
    flexShrink: 0,

    display: "grid",
    placeItems: "center",
  },
});

/**
 * Group a set of category buttons
 */
export const CategoryButtonGroup = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",

    /* The group is the card; the rows are rows in it.
     *
     * Each row used to be its own bordered, rounded, gapped card. Eight
     * separate cards down a settings page read as eight unrelated things of
     * equal importance -- which is the "no hierarchy, everything the same
     * size" complaint. Grouping is the hierarchy: what belongs together
     * shares an edge, and the gap between groups is what separates topics.
     */
    background: "var(--pd-surface-raised)",
    border: "1px solid var(--pd-border-subtle)",
    borderRadius: "var(--pd-radius-lg)",
    boxShadow: "var(--pd-shadow-raised)",
    overflow: "hidden",

    /* Direct rows, and the summary row of a collapsible one. Hairlines go on
       the top of every row but the first, so no rule is left dangling at the
       bottom edge whichever kind of child comes last. */
    "& > a, & > div > summary > a": {
      background: "transparent",
      border: "none",
      borderRadius: 0,
    },
    "& > a:not(:first-child), & > div:not(:first-child) > summary > a": {
      borderTop: "1px solid var(--pd-border-subtle)",
    },
    /* Hover is a fill now -- there is no per-row border left to light up. */
    "& > a:hover, & > div > summary > a:hover": {
      background: "var(--pd-tint-subtle)",
    },
  },
});

CategoryButton.Group = CategoryButtonGroup;

type CollapseProps = Omit<
  ComponentProps<typeof CategoryButton>,
  "onClick" | "children"
> & {
  children?: JSX.Element;
  title?: JSX.Element;

  scrollable?: boolean;
};

/**
 * Category button with collapsed children
 */
export function CategoryCollapse(props: CollapseProps) {
  const [local, remote] = splitProps(props, ["action", "children"]);

  const [opened, setOpened] = createSignal(false);

  let details: HTMLDivElement | undefined;
  let column: HTMLDivElement | undefined;

  /**
   * Toggle the opened state and scroll to the beginning of contents
   */
  const toggleOpened = () => {
    const openedState = opened();

    if (!openedState) {
      column?.scroll({ top: 0 });
    }

    setOpened(!openedState);
  };

  /**
   * Recalculate the column height for transition
   */
  const updatedHeight = () => {
    const calculatedHeight = opened()
      ? Math.min(column?.scrollHeight || 0, 340)
      : 0;

    return `${calculatedHeight}px`;
  };

  return (
    <Details
      ref={details!}
      onClick={toggleOpened}
      class={opened() ? "open" : undefined}
    >
      <summary>
        <CategoryButton
          {...remote}
          action={[local.action, "collapse"].flat()}
          onClick={() => void 0}
        >
          {props.title}
        </CategoryButton>
      </summary>
      <Switch
        fallback={
          <div
            class={innerColumn({ static: true })}
            ref={column!}
            style={{ height: updatedHeight() }}
          >
            {props.children}
          </div>
        }
      >
        <Match when={props.scrollable}>
          <div
            ref={column!}
            style={{ height: updatedHeight() }}
            use:scrollable={{ class: innerColumn() }}
          >
            {props.children}
          </div>
        </Match>
      </Switch>
    </Details>
  );
}

CategoryButton.Collapse = CategoryCollapse;

/**
 * Column with inner content
 */
const innerColumn = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-xs)",

    borderRadius: "var(--borderRadius-md)",
    transition: "var(--pd-transition-slow)",

    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  variants: {
    static: {
      true: {
        overflow: "hidden",
      },
    },
  },
});

/**
 * Parent base component
 */
const Details = styled("div", {
  base: {
    "&:not(.open) .InnerColumn": {
      opacity: 0,
      pointerEvents: "none",
    },

    /* add transition to the icon */
    "& summary div:last-child svg": {
      transition: "var(--pd-transition-slow)",
    },

    /* rotate chevron when it is open */
    "&.open summary div:last-child svg": {
      transform: "rotate(180deg)",
    },

    /* add additional padding between top button and children when it is open */
    "&.open summary": {
      marginBottom: "var(--gap-xs)",
    },

    /* hide the default details component marker */
    "& summary": {
      transition: "var(--pd-transition-slow)",
      listStyle: "none",
    },

    "& summary::marker, summary::-webkit-details-marker": {
      display: "none",
    },

    /* connect elements vertically */
    // "& > :not(summary) .CategoryButton": {
    //   /* and set child backgrounds */
    //   background: "var(--unset-bg)",
    // },
  },
});
