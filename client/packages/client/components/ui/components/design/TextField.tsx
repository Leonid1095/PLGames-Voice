import { type JSX, Show, createUniqueId, splitProps } from "solid-js";

import { css } from "styled-system/css";

type Props = JSX.HTMLAttributes<HTMLInputElement> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  autoFocus?: boolean;
  required?: boolean;
  name?: string;
  label?: string;
  autosize?: boolean;
  disabled?: boolean;
  rows?: number;
  "min-rows"?: number;
  "max-rows"?: number;
  placeholder?: string;
  type?: "text" | "password" | "email" | "file";
  variant?: "filled" | "outlined";
  enterkeyhint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "find";
};

/**
 * Text fields let users enter text into a UI.
 *
 * Native input (or textarea when rows/autosize are given) rather than an MDUI
 * web component. MDUI rendered into a closed shadow DOM, so the only way to
 * restyle it was custom properties aimed through the boundary — quietPro.css
 * carried a block of exactly that, including a ::part() override forced with
 * !important.
 *
 * The label is a mono uppercase caption above the field instead of Material's
 * floating label. A label that animates into the border cannot be read while
 * the field has content, which is the moment you most want to know what you
 * are editing.
 */
export function TextField(props: Props) {
  const [local, rest] = splitProps(props, [
    "label",
    "variant",
    "autosize",
    "rows",
    "min-rows",
    "max-rows",
    "class",
    "type",
  ]);

  const id = createUniqueId();
  const multiline = () =>
    local.autosize || local.rows !== undefined || local["min-rows"] !== undefined;

  return (
    <div class={wrapper()}>
      <Show when={local.label}>
        <label class={`pd-label ${label()}`} for={id}>
          {local.label}
        </label>
      </Show>

      <Show
        when={multiline()}
        fallback={
          <input
            id={id}
            type={local.type ?? "text"}
            {...(rest as JSX.InputHTMLAttributes<HTMLInputElement>)}
            class={`${field()} ${local.class ?? ""}`}
          />
        }
      >
        <textarea
          id={id}
          rows={local.rows ?? local["min-rows"] ?? 3}
          {...(rest as unknown as JSX.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          class={`${field()} ${textarea()} ${local.class ?? ""}`}
        />
      </Show>
    </div>
  );
}

/**
 * Select menu allows the user to pick a menu item.
 *
 * Use the `MenuItem` component as the child:
 * ```tsx
 * <TextField.Select>
 *   <MenuItem value="itemA">hello!</MenuItem>
 *   <MenuItem value="itemB">world!</MenuItem>
 * </TextField.Select>
 * ```
 *
 * Native select: MenuItem renders <option>, so keyboard type-ahead and the
 * platform picker on mobile come for free. `currentTarget.value` on change
 * behaves exactly as the MDUI version did, so form wiring is unchanged.
 */
function Select(
  props: JSX.HTMLAttributes<HTMLSelectElement> & {
    value?: string;
    variant?: "filled" | "outlined";
    required?: boolean;
    disabled?: boolean;
    label?: string;
  },
) {
  const [local, rest] = splitProps(props, ["variant", "class", "label"]);
  const id = createUniqueId();

  return (
    <div class={wrapper()}>
      <Show when={local.label}>
        <label class={`pd-label ${label()}`} for={id}>
          {local.label}
        </label>
      </Show>
      <select id={id} {...rest} class={`${field()} ${select()} ${local.class ?? ""}`} />
    </div>
  );
}

TextField.Select = Select;

const wrapper = () =>
  css({
    display: "flex",
    flexDirection: "column",
    gap: "var(--pd-space-1)",
    minWidth: 0,
  });

const label = () =>
  css({
    // .pd-label supplies the mono uppercase treatment; this only positions it.
    cursor: "default",
  });

const field = () =>
  css({
    width: "100%",
    minWidth: 0,
    minHeight: "42px",
    padding: "0 var(--pd-space-3)",
    background: "var(--md-sys-color-surface-container-lowest)",
    color: "var(--md-sys-color-on-surface)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "var(--pd-radius-md)",
    font: "inherit",
    fontSize: "var(--pd-text-base)",
    transition: "border-color var(--pd-transition-fast)",

    "&::placeholder": { color: "var(--md-sys-color-on-surface-variant)" },
    "&:hover:not(:disabled)": { borderColor: "var(--md-sys-color-outline)" },
    "&:focus": {
      outline: "none",
      borderColor: "var(--md-sys-color-primary)",
    },
    "&:disabled": { opacity: 0.5, cursor: "default" },
    // Native validity styling only after the field has been interacted with,
    // so an empty required field is not red before anyone has typed.
    "&:user-invalid": { borderColor: "var(--md-sys-color-error)" },
  });

const textarea = () =>
  css({
    padding: "var(--pd-space-2) var(--pd-space-3)",
    lineHeight: "var(--pd-leading-normal)",
    resize: "vertical",
  });

const select = () =>
  css({
    cursor: "pointer",

    /*
     * Replace the platform chrome. The default select arrow is the one
     * control the browser draws itself, and next to the styled inputs it
     * reads as unfinished. appearance:none removes it; the chevron comes
     * back as an inline SVG background so it needs no extra markup. The
     * stroke is a fixed mid-grey (#8A8479) that holds on both paper and ink,
     * because a background-image cannot read currentColor.
     */
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A8479' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right var(--pd-space-3) center",
    paddingInlineEnd: "var(--pd-space-10)",
  });
