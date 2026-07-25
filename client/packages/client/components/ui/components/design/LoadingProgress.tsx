import { useLingui } from "@lingui-solid/solid/macro";

import { Meter } from "./Meter";

/**
 * Indefinite loading indicator.
 *
 * Renders the Полдень amplitude meter rather than a spinning ring, in accent
 * rather than the "live" jade: loading is a system state, not a voice state,
 * and the two have to stay distinguishable.
 *
 * The export keeps its old name so callers do not have to change; it is no
 * longer circular, and no longer an MDUI web component.
 */
export function CircularProgress() {
  const { t } = useLingui();
  return <Meter tone="accent" label={t`Loading`} />;
}
