import { Accessor, For, Setter, Show, onMount } from "solid-js";
import { AlertCircle, ArrowUpRight } from "lucide-solid";

import { styled } from "styled-system/jsx";

import { Column, OverflowingText, Ripple } from "@revolt/ui";

// // import { SettingsList } from "..";
import { useSettingsNavigation } from "../Settings";

import {
  SidebarButton,
  SidebarButtonContent,
  SidebarButtonTitle,
} from "./SidebarButton";

/**
 * Settings Sidebar Layout
 */
export function SettingsSidebar(props: {
  list: Accessor<SettingsList<unknown>>;

  setPage: Setter<string | undefined>;
  page: Accessor<string | undefined>;
}) {
  const { navigate } = useSettingsNavigation();

  /**
   * Select first page on load
   */
  onMount(() => {
    if (!props.page()) {
      props.setPage(props.list().entries[0].entries[0].id);
    }
  });

  return (
    <Base>
      <div use:invisibleScrollable>
        <Content>
          <Column gap="lg">
            {props.list().prepend}
            <For each={props.list().entries}>
              {(category) => (
                <Show when={!category.hidden}>
                  <Column>
                    <Show when={category.title}>
                      <CategoryTitle>{category.title}</CategoryTitle>
                    </Show>
                    <Column gap="s">
                      <For each={category.entries}>
                        {(entry) => (
                          <Show when={!entry.hidden}>
                            <SidebarButton
                              onClick={() => navigate(entry)}
                              aria-selected={
                                props.page()?.split("/")[0] ===
                                entry.id?.split("/")[0]
                              }
                            >
                              <Ripple />
                              <SidebarButtonTitle>
                                {entry.icon}
                                <SidebarButtonContent>
                                  <OverflowingText>
                                    {entry.title}
                                  </OverflowingText>
                                </SidebarButtonContent>
                              </SidebarButtonTitle>
                              {/*<SidebarButtonIcon>
                                <ArrowUpRight
                                  {...iconSize(20)}
                                  fill={theme!.colour("primary")}
                                />
                                <AlertCircle
                                  {...iconSize(20)}
                                  fill={theme!.colour("primary")}
                                />
                              </SidebarButtonIcon>*/}
                            </SidebarButton>
                          </Show>
                        )}
                      </For>
                    </Column>
                  </Column>
                </Show>
              )}
            </For>
            {props.list().append}
          </Column>
        </Content>
      </div>
    </Base>
  );
}

/**
 * Base layout of the sidebar
 */
const Base = styled("div", {
  base: {
    display: "flex",
    flex: "1 0 218px",
    paddingLeft: "8px",
    justifyContent: "flex-end",
  },
});

/**
 * Aligned content within the sidebar
 */
const Content = styled("div", {
  base: {
    minWidth: "230px",
    maxWidth: "300px",
    /* Keeps the first nav item on the same baseline as the pane heading. */
    padding: "46px 0 8px",
    display: "flex",
    gap: "2px",

    flexDirection: "column",

    "& a > div": {
      margin: 0,
    },
  },
});

/**
 * Titles for each category
 */
const CategoryTitle = styled("span", {
  base: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",

    /* The mono label, same as every other section marker in the app. It was
       the body face at 600 with its own tracking -- one more bespoke type
       treatment in a place that already has a shared one. */
    fontFamily: "var(--pd-font-mono)",
    textTransform: "uppercase",
    fontSize: "var(--pd-text-xs)",
    fontWeight: "var(--pd-weight-regular)",
    letterSpacing: "var(--pd-tracking-label)",
    margin: "18px 12px 6px",

    color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
  },
});
