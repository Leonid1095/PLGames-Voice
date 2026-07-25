import { css } from "styled-system/css";

/**
 * Indefinite loading indicator.
 *
 * Renders the Полдень amplitude meter rather than a spinning ring: the same
 * bars that mark a speaking user and the typing indicator, so "something is
 * happening" looks the same everywhere in the product.
 *
 * The export keeps its old name so callers do not have to change; it is no
 * longer circular, and no longer an MDUI web component.
 */
export function CircularProgress() {
  return (
    <div class={`pd-meter ${meter()}`} role="status" aria-label="Загрузка">
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

const meter = () =>
  css({
    // Accent rather than the "live" jade: loading is a system state, not a
    // voice state, and the two must stay distinguishable.
    color: "var(--md-sys-color-primary)",
  });
