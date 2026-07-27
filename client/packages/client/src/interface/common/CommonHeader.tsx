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
        {/* The collapse chevron only surfaces on hover. Permanently visible
            it read as a back button and tripled the header into
            "< [icon] Title" — three affordances for one page. */}
        <span class={`chev ${chevron}`}>
          <Switch fallback={<ChevronRight size={18} />}>
            <Match
              when={state.layout.getSectionState(
                LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
                true,
              )}
            >
              <ChevronLeft size={18} />
            </Match>
          </Switch>
        </span>
      </Show>
      {props.children}
    </div>
  );
}

const container = css({
  display: "flex",
  cursor: "pointer",
  alignItems: "center",
  gap: "2px",
  padding: "4px 6px",
  borderRadius: "var(--pd-radius-sm)",
  transition: "background-color var(--pd-transition-fast)",

  _hover: {
    background: "var(--pd-tint-subtle)",
    "& .chev": {
      width: "18px",
      opacity: 1,
    },
  },
});

const chevron = css({
  display: "inline-flex",
  alignItems: "center",
  overflow: "hidden",
  width: 0,
  opacity: 0,
  transition: "width var(--pd-transition-fast), opacity var(--pd-transition-fast)",
});
