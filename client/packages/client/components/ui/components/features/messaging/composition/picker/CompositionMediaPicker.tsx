import { useFloating } from "solid-floating-ui";
import {
  Accessor,
  JSX,
  Match,
  Ref,
  Setter,
  Show,
  Switch,
  createContext,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { flip, offset, shift } from "@floating-ui/dom";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";


import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";

interface Props {
  /**
   * User card trigger area
   * @param triggerProps Props that need to be applied to the trigger area
   */
  children: (triggerProps: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: Ref<any>;
    onClickGif: () => void;
    onClickEmoji: () => void;
  }) => JSX.Element;

  /**
   * Send a message
   */
  onMessage: (content: string) => void;

  /**
   * Text replacement
   */
  onTextReplacement: (node: string) => void;
}

export const CompositionMediaPickerContext = createContext(
  null as unknown as Pick<Props, "onMessage" | "onTextReplacement">,
);

export function CompositionMediaPicker(props: Props) {
  const [anchor, setAnchor] = createSignal<HTMLElement>();
  const [show, setShow] = createSignal<"gif" | "emoji">();

  return (
    <CompositionMediaPickerContext.Provider value={props}>
      {props.children({
        ref: setAnchor,
        onClickGif: () =>
          setShow((current) => (current === "gif" ? undefined : "gif")),
        onClickEmoji: () =>
          setShow((current) => (current === "emoji" ? undefined : "emoji")),
      })}
      <Portal mount={document.getElementById("floating")!}>
        <Presence>
          <Show when={show()}>
            <Motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, easing: [0.87, 0, 0.13, 1] }}
            >
              <Picker
                anchor={anchor}
                show={show}
                setShow={setShow}
                onMessage={props.onMessage}
                onTextReplacement={props.onTextReplacement}
              />
            </Motion>
          </Show>
        </Presence>
      </Portal>
    </CompositionMediaPickerContext.Provider>
  );
}

function Picker(
  props: Pick<Props, "onMessage" | "onTextReplacement"> & {
    anchor: Accessor<HTMLElement | undefined>;
    show: Accessor<"gif" | "emoji" | undefined>;
    setShow: Setter<"gif" | "emoji" | undefined>;
  },
) {
  const [floating, setFloating] = createSignal<HTMLDivElement>();

  const position = useFloating(() => props.anchor(), floating, {
    placement: "top-end",
    middleware: [offset(5), flip(), shift()],
  });

  // Close the picker only when the click happens OUTSIDE its root.
  // Previously any mousedown anywhere on the document closed it, which
  // also fired when the user clicked the Tab buttons inside the picker
  // (event.stopPropagation() in those handlers can't help — Solid uses
  // event delegation on document, so by the time the user handler runs,
  // we're already on document and this listener fires anyway).
  function onMouseDown(e: MouseEvent) {
    const root = floating();
    if (root && e.target instanceof Node && root.contains(e.target)) return;
    props.setShow();
  }

  onMount(() => document.addEventListener("mousedown", onMouseDown));
  onCleanup(() => document.removeEventListener("mousedown", onMouseDown));

  return (
    <Base
      ref={setFloating}
      style={{
        position: position.strategy,
        top: `${position.y ?? 0}px`,
        left: `${position.x ?? 0}px`,
      }}
    >
      <Container>
        <Switch>
          <Match when={props.show() === "gif"}>
            <GifPicker />
          </Match>
          <Match when={props.show() === "emoji"}>
            <EmojiPicker />
          </Match>
        </Switch>
      </Container>
    </Base>
  );
}

/**
 * Base element
 */
const Base = styled("div", {
  base: {
    width: "400px",
    height: "400px",
    // paddingInlineEnd: "5px",
  },
});

/**
 * Container element for the picker
 */
const Container = styled("div", {
  base: {
    width: "100%",
    height: "100%",

    userSelect: "none",

    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",

    alignItems: "stretch",

    overflow: "hidden",
    padding: "var(--gap-md) 0",

    borderRadius: "var(--borderRadius-lg)",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
    boxShadow: "0 0 3px var(--md-sys-color-shadow)",
    background: "var(--md-sys-color-surface-container)",
  },
});

/**
 * Styles for the content container
 */
export const compositionContent = cva({
  base: {
    flexGrow: 1,
    minHeight: 0,
  },
});
