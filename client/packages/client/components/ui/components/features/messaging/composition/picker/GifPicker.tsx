import {
  Match,
  Switch,
  createSignal,
} from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { MyGifPicker } from "./MyGifPicker";

export function GifPicker() {
  const [tab, setTab] = createSignal<"my" | "search">("my");

  return (
    <Stack>
      <TabBar>
        <Tab
          active={tab() === "my"}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => setTab("my")}
        >
          <Trans>My GIFs</Trans>
        </Tab>
        <Tab
          active={tab() === "search"}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => setTab("search")}
        >
          <Trans>Search</Trans>
        </Tab>
      </TabBar>
      <Switch>
        <Match when={tab() === "my"}>
          <MyGifPicker />
        </Match>
        <Match when={tab() === "search"}>
          <SearchPlaceholder>
            <Symbol size={32}>search_off</Symbol>
            <Trans>GIF search is temporarily unavailable</Trans>
          </SearchPlaceholder>
        </Match>
      </Switch>
    </Stack>
  );
}

const TabBar = styled("div", {
  base: {
    display: "flex",
    gap: "2px",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    marginBottom: "var(--gap-sm)",
  },
});

const Tab = styled("button", {
  base: {
    flex: 1,
    padding: "var(--gap-sm) var(--gap-md)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface-variant)",
    borderBottom: "2px solid transparent",
    transition: "all 0.15s",
    "&:hover": {
      color: "var(--md-sys-color-on-surface)",
    },
  },
  variants: {
    active: {
      true: {
        color: "var(--md-sys-color-primary)",
        borderBottomColor: "var(--md-sys-color-primary)",
      },
    },
  },
});

const Stack = styled("div", {
  base: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
});

const SearchPlaceholder = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 16px",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "14px",
    textAlign: "center",
    opacity: 0.7,
    flex: 1,
  },
});
