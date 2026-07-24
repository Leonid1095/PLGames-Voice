import { useLingui } from "@lingui-solid/solid/macro";

/**
 * Heading shown above an activity's name — "Playing", "Listening to", ...
 *
 * The profile card, the member list and the set-activity modal each carried
 * their own copy of this switch, so adding a kind meant finding all three —
 * and they had already drifted: the member list said "На матче в" where the
 * profile said "На соревновании" for the same kind.
 *
 * It is a hook rather than a plain function because the project translates
 * through `useLingui()` (89 files do, 2 use the module-level macro), and only
 * that form re-renders when the user switches language.
 *
 * `kind` is the raw string off a user's activity. `fallback` covers the
 * no-activity case: the profile card passes its own "Activity" heading, the
 * member list passes "" so the row collapses.
 */
export function useActivityLabel() {
  const { t } = useLingui();

  return (kind: string | undefined, fallback = ""): string => {
    switch (kind) {
      case "Playing":
        return t`Playing`;
      case "Streaming":
        return t`Streaming`;
      case "Listening":
        return t`Listening to`;
      case "Watching":
        return t`Watching`;
      case "Competing":
        return t`Competing in`;
      default:
        return fallback;
    }
  };
}
