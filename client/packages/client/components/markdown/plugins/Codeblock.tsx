import { JSX, createSignal } from "solid-js";

import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

const Codeblock = styled("pre", {
  base: {
    color: "#c9d1d9",
    background: "#0d1117",

    position: "relative",
    width: "fit-content",

    padding: "var(--gap-md)",
    marginY: "var(--gap-sm)",
    borderRadius: "var(--borderRadius-md)",

    wordWrap: "break-word",
    whiteSpace: "pre-wrap",

    "&> code": {
      color: "inherit !important",
      background: "transparent !important",
    },

    "&:hover .copy-btn": {
      opacity: 1,
    },
  },
});

const copyBtnClass = css({
  position: "absolute",
  top: "6px",
  right: "6px",
  opacity: 0,
  transition: "opacity 0.15s ease",

  display: "flex",
  alignItems: "center",
  gap: "4px",

  padding: "4px 8px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",

  fontSize: "12px",
  fontFamily: "inherit",
  color: "#c9d1d9",
  background: "rgba(110, 118, 129, 0.4)",

  "&:hover": {
    background: "rgba(110, 118, 129, 0.6)",
  },

  "&:active": {
    background: "rgba(110, 118, 129, 0.8)",
  },
});

/**
 * Render a code block with copy text button
 */
export function RenderCodeblock(props: {
  children: JSX.Element;
  class?: string;
}) {
  let preRef: HTMLPreElement | undefined;
  const [copied, setCopied] = createSignal(false);

  const handleCopy = () => {
    if (!preRef) return;
    const code = preRef.querySelector("code");
    const text = (code ?? preRef).textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Codeblock ref={preRef}>
      <button class={`copy-btn ${copyBtnClass}`} onClick={handleCopy}>
        {copied() ? "✓" : "⧉"}
      </button>
      {props.children}
    </Codeblock>
  );
}
