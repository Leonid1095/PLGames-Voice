import { ChevronRight } from "lucide-solid";
import { useFloating } from "solid-floating-ui";
import {
  Component,
  ComponentProps,
  JSX,
  Show,
  createSignal,
  splitProps,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { autoUpdate, offset, shift } from "@floating-ui/dom";
import { styled } from "styled-system/jsx";

import { Text, iconSize, symbolSize } from "@revolt/ui";

const Base = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "6px 8px",
    overflow: "hidden",
    borderRadius: "8px",
    background: "var(--md-sys-color-surface-container-lowest)",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
    boxShadow: "var(--pd-shadow-float)",
    border: "none",

    userSelect: "none",
    minWidth: "188px",
  },
});

export function ContextMenu(props: ComponentProps<typeof Base>) {
  return (
    <Base
      // prevent context menu closing itself before click event
      onMouseDown={(e) => e.stopImmediatePropagation()}
      {...props}
    />
  );
}

export const ContextMenuDivider = styled("div", {
  base: {
    height: "1px",
    margin: "4px",
    background: "var(--md-sys-color-outline-variant)",
    opacity: 0.4,
  },
});

export const ContextMenuItem = styled("a", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    padding: "6px 8px",
    borderRadius: "4px",
    margin: "1px 0",
    transition: "background-color var(--transition-fast), color var(--transition-fast), fill var(--transition-fast)",

    "&:hover": {
      background: "var(--md-sys-color-primary)",
      color: "var(--md-sys-color-on-primary)",
      fill: "var(--md-sys-color-on-primary)",
    },

    "& span": {
      flexGrow: 1,
    },
  },
  variants: {
    selected: {
      true: {
        background: "var(--md-sys-color-primary)",
        color: "var(--md-sys-color-on-primary)",
        fill: "var(--md-sys-color-on-primary)",
      },
      false: {},
    },
    action: {
      true: {
        cursor: "pointer",
      },
    },
    button: {
      true: {
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "var(--gap-md)",
        "& span": {
          marginTop: "1px",
        },
      },
    },
    _titleCase: {
      true: {},
      false: {},
    },
    destructive: {
      true: {
        fill: "var(--md-sys-color-error)",
        color: "var(--md-sys-color-error)",
        "&:hover": {
          background: "var(--md-sys-color-error)",
          color: "#ffffff",
          fill: "#ffffff",
        },
      },
    },
  },
  defaultVariants: {
    _titleCase: true,
    selected: false,
  },
  compoundVariants: [
    {
      _titleCase: true,
      button: true,
      css: {
        textTransform: "capitalize",
      },
    },
  ],
});

type ButtonProps = ComponentProps<typeof ContextMenuItem> & {
  icon?: JSX.Element | Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  symbol?: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  destructive?: boolean;
  actionIcon?: JSX.Element | Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  actionSymbol?: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
};

export function ContextMenuButton(props: ButtonProps) {
  const [local, remote] = splitProps(props, [
    "icon",
    "symbol",
    "actionIcon",
    "actionSymbol",
    "children",
  ]);

  return (
    <ContextMenuItem button {...remote}>
      {typeof local.icon === "function"
        ? local.icon?.(iconSize(16))
        : local.icon}
      {local.symbol?.(symbolSize(16))}
      <Text>{local.children}</Text>
      {typeof local.actionIcon === "function"
        ? local.actionIcon?.(iconSize(20))
        : local.actionIcon}
      {local.actionSymbol?.(symbolSize(20))}
    </ContextMenuItem>
  );
}

export function ContextMenuSubMenu(
  props: Omit<
    ButtonProps,
    "ref" | "onClick" | "onMouseEnter" | "onMouseLeave"
  > & {
    buttonContent: JSX.Element;
    onClick?: () => void;
  },
) {
  const [anchor, setAnchor] = createSignal<HTMLDivElement>();
  const [ref, setRef] = createSignal<HTMLDivElement>();

  const [show, setShow] = createSignal<"hide" | "show" | boolean>(false);
  const [local, buttonProps] = splitProps(props, [
    "children",
    "buttonContent",
    "onClick",
  ]);

  function isShowing() {
    return show() === true || show() === "show";
  }

  const position = useFloating(anchor, ref, {
    placement: "right-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), shift()],
  });

  return (
    <>
      <ContextMenuButton
        ref={setAnchor}
        selected={isShowing()}
        actionIcon={ChevronRight}
        onMouseDown={(e) => {
          e.stopImmediatePropagation();
        }}
        onClick={(e) => {
          if (local.onClick) {
            local.onClick();
          } else {
            e.stopImmediatePropagation();
            setShow(isShowing() ? false : "show");
          }
        }}
        onMouseEnter={() => setShow((show) => (show === "hide" ? show : true))}
        {...buttonProps}
      >
        {local.buttonContent}
      </ContextMenuButton>
      <Portal mount={document.getElementById("floating")!}>
        <Presence>
          <Show when={isShowing()}>
            <Motion
              ref={setRef}
              style={{
                position: position.strategy,
                top: `${position.y ?? 0}px`,
                left: `${position.x ?? 0}px`,
                "z-index": 1000,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.1, easing: [0.2, 0, 0, 1] }}
              onMouseLeave={() =>
                setShow((show) => (show === true ? false : show))
              }
              // stop submenu from closing context menu
              onMouseDown={(e) => e.stopImmediatePropagation()}
            >
              <div
                onClick={(e) => {
                  if (local.onClick) {
                    local.onClick();
                  } else {
                    // prevent submenu trigger from closing context menu
                    e.stopImmediatePropagation();
                    setShow((show) => (show ? "hide" : true));
                  }
                }}
                // float a virtual element to ensure the mouseLeave event covers
                // both the anchor/button we attached to and the newly created context menu
                style={{
                  position: "fixed",
                  top: 0,
                  left: `-${(anchor()?.clientWidth ?? 0) + 5}px`,
                  width: `${(anchor()?.clientWidth ?? 0) + 5}px`,
                  height: `${anchor()?.clientHeight ?? 0}px`,
                  cursor: "pointer",
                }}
              />
              <ContextMenu>{local.children}</ContextMenu>
            </Motion>
          </Show>
        </Presence>
      </Portal>
    </>
  );
}
