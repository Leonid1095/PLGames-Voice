import { JSX, Match, Show, Switch } from "solid-js";
import { ChevronLeft, ChevronRight } from "lucide-solid";

import { useLingui } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";

import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { useMobile } from "../MobileContext";

/**
 * Wrapper for header icons which adds the chevron on the
 * correct side for toggling sidebar (if on desktop) and
 * the hamburger icon to open sidebar (if on mobile).
 */
export function HeaderIcon(props: { children: JSX.Element }) {
  const state = useState();
  const { t } = useLingui();
  const { isMobile, toggleSidebar } = useMobile();

  return (
    <div
      class={container}
      onClick={() => {
        if (isMobile()) {
          toggleSidebar();
        } else {
          state.layout.toggleSectionState(LAYOUT_SECTIONS.PRIMARY_SIDEBAR, true);
        }
      }}
      use:floating={{
        tooltip: {
          placement: "bottom",
          content: t`Toggle main sidebar`,
        },
      }}
    >
      <Show
        when={!isMobile()}
        fallback={<Symbol size={22}>menu</Symbol>}
      >
        <Switch fallback={<ChevronRight size={20} />}>
          <Match
            when={state.layout.getSectionState(
              LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
              true,
            )}
          >
            <ChevronLeft size={20} />
          </Match>
        </Switch>
      </Show>
      {props.children}
    </div>
  );
}

const container = css({
  display: "flex",
  cursor: "pointer",
  alignItems: "center",
});
