import type { JSX } from "solid-js";

/**
 * A single option inside `TextField.Select`.
 *
 * Despite the name, this is not a context-menu row: application menus are
 * built from ContextMenuItem / ContextMenuButton in app/menus/ContextMenu.
 * Every use of this component in the codebase is a select option, so it
 * renders <option> and the surrounding <select> gets native keyboard
 * behaviour, type-ahead and the platform's own picker on mobile.
 *
 * The name is kept because it appears at every call site and in the
 * TextField.Select docblock; renaming it is churn without benefit.
 */
export function MenuItem(props: {
  value?: string;
  disabled?: boolean;
  children?: JSX.Element;
}) {
  return (
    <option value={props.value} disabled={props.disabled}>
      {props.children}
    </option>
  );
}
