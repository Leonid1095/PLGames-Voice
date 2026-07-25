import { Index } from "solid-js";

/**
 * Полдень amplitude meter — the product's signature "live signal".
 *
 * The same bars mark a speaking user, a typing indicator and every loading
 * state, so "something is happening" looks identical wherever it appears. The
 * styling lives in themes/polden.css; this only owns the markup.
 *
 * Colour comes from currentColor, which is what lets one component read as
 * jade next to a speaker and as accent while loading. Voice states must use
 * `tone="live"`: a voice app cannot afford to make "someone is talking" and
 * "this is a button" the same colour.
 */
export function Meter(props: {
  /**
   * Bar height
   * @default "md"
   */
  readonly size?: "sm" | "md" | "lg";

  /**
   * Which signal this is
   * @default "live"
   */
  readonly tone?: "live" | "accent" | "inherit";

  /**
   * Number of bars — polden.css staggers the delays of the first seven
   * @default 5
   */
  readonly bars?: number;

  /**
   * Accessible name. Omit for decoration that sits beside a visible label,
   * which is the usual case next to a username.
   */
  readonly label?: string;
}) {
  return (
    <div
      class={
        "pd-meter" +
        (props.size && props.size !== "md" ? ` pd-meter--${props.size}` : "") +
        (props.tone === "accent" ? " pd-meter--accent" : "")
      }
      style={props.tone === "inherit" ? { color: "currentColor" } : undefined}
      role={props.label ? "status" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
    >
      <Index each={Array.from({ length: props.bars ?? 5 })}>{() => <i />}</Index>
    </div>
  );
}
