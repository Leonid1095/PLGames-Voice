import { Accessor, JSX, Show } from "solid-js";
import { X } from "lucide-solid";

import { css, cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { Breadcrumbs, IconButton, Text, iconSize } from "@revolt/ui";

import { SettingsList } from "..";
import { useSettingsNavigation } from "../Settings";

/**
 * Content portion of the settings menu
 */
export function SettingsContent(props: {
  onClose?: () => void;
  children: JSX.Element;
  list: Accessor<SettingsList<unknown>>;
  title: (ctx: SettingsList<never>, key: string) => string;
  page: Accessor<string | undefined>;
}) {
  const { navigate } = useSettingsNavigation();

  return (
    <div
      use:scrollable={{
        class: base(),
      }}
    >
      <Show when={props.page()}>
        <InnerContent>
          <InnerColumn>
            <Text class="title" size="large">
              <Breadcrumbs
                elements={props.page()!.split("/")}
                renderElement={(key) =>
                  props.title(props.list() as SettingsList<never>, key)
                }
                navigate={(keys) => navigate(keys.join("/"))}
              />
            </Text>
            {props.children}
            <div class={css({ minHeight: "80px" })} />
          </InnerColumn>
        </InnerContent>
      </Show>
      <Show when={props.onClose}>
        <CloseAction>
          <IconButton variant="standard" size="sm" onPress={props.onClose}>
            <X {...iconSize(20)} />
          </IconButton>
        </CloseAction>
      </Show>
    </div>
  );
}

/**
 * Base styles
 */
const base = cva({
  base: {
    minWidth: 0,
    flex: "1 1 800px",
    flexDirection: "row",
    display: "flex",
    background: "var(--md-sys-color-surface-container-lowest)",
    borderLeft: "1px solid var(--pd-border-subtle)",

    "& > a": {
      textDecoration: "none",
    },
  },
});

/**
 * Settings pane
 */
const InnerContent = styled("div", {
  base: {
    gap: "13px",
    minWidth: 0,
    width: "100%",
    display: "flex",
    maxWidth: "740px",
    padding: "52px 32px",
    justifyContent: "stretch",
    zIndex: 1,
  },
});

/**
 * Pane content column
 */
const InnerColumn = styled("div", {
  base: {
    width: "100%",
    /* Groups are cards now, so the space between them is what separates one
       topic from the next. 8px was the gap between individual rows. */
    gap: "16px",
    display: "flex",
    flexDirection: "column",
    marginBlockEnd: "80px",
  },
});

/**
 * Positioning for close button
 */
const CloseAction = styled("div", {
  base: {
    /* A way out, not a feature.
     *
     * This was flexGrow: 1, so closing the settings claimed an entire elastic
     * column of the pane and sat there as a filled disc with a bold ESC under
     * it -- the heaviest object on a screen whose job is the content next to
     * it. It is now a plain icon at the top-right corner, sized like the rest
     * of the chrome, with the shortcut as a quiet keycap hint. */
    flexShrink: 0,
    padding: "52px 12px",
    visibility: "visible",
    position: "sticky",
    top: 0,

    display: "flex",
    flexDirection: "column",
    alignItems: "center",

    "&:after": {
      content: '"ESC"',
      marginTop: "2px",
      fontFamily: "var(--pd-font-mono)",
      fontSize: "var(--pd-text-xs)",
      letterSpacing: "var(--pd-tracking-label)",
      color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
    },
  },
});
