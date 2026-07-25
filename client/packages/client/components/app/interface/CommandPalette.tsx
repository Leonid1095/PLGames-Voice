import { Hash, MessageCircle, Server, Settings, User, Volume2 } from "lucide-solid";
import {
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";

interface SearchResult {
  id: string;
  type: "channel" | "user" | "server" | "action";
  name: string;
  detail?: string;
  icon?: "text" | "voice" | "person" | "server" | "dm" | "settings";
  action: () => void;
}

/**
 * Command palette (Ctrl+K) — quick search for channels, users, servers, actions
 */
export function CommandPalette() {
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();

  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;

  // Global Ctrl+K listener
  const handleGlobalKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      e.stopPropagation();
      setOpen((v) => !v);
      setQuery("");
      setSelectedIndex(0);
    }
  };

  onMount(() => {
    document.addEventListener("keydown", handleGlobalKey, true);
  });
  onCleanup(() => {
    document.removeEventListener("keydown", handleGlobalKey, true);
  });

  // Focus input when opened
  createEffect(() => {
    if (open()) {
      setTimeout(() => inputRef?.focus(), 10);
    }
  });

  const results = (): SearchResult[] => {
    const q = query().toLowerCase().trim();
    const items: SearchResult[] = [];
    const c = client();

    // Channels
    for (const server of c.servers.toList()) {
      for (const channel of server.channels) {
        if (!channel) continue;
        const name = channel.name ?? "";
        if (q && !name.toLowerCase().includes(q)) continue;
        items.push({
          id: `ch-${channel.id}`,
          type: "channel",
          name,
          detail: server.name,
          icon: channel.type === "VoiceChannel" ? "voice" : "text",
          action: () =>
            navigate(`/server/${server.id}/channel/${channel.id}`),
        });
      }
    }

    // DMs
    for (const channel of c.channels.toList()) {
      if (
        channel.type !== "DirectMessage" &&
        channel.type !== "Group" &&
        channel.type !== "SavedMessages"
      )
        continue;
      const name = channel.displayName ?? channel.type;
      if (q && !name.toLowerCase().includes(q)) continue;
      items.push({
        id: `dm-${channel.id}`,
        type: "channel",
        name,
        icon: "dm",
        action: () => navigate(`/channel/${channel.id}`),
      });
    }

    // Servers
    for (const server of c.servers.toList()) {
      if (q && !server.name.toLowerCase().includes(q)) continue;
      items.push({
        id: `srv-${server.id}`,
        type: "server",
        name: server.name,
        icon: "server",
        action: () => {
          const firstChannel = server.channels[0];
          if (firstChannel) {
            navigate(`/server/${server.id}/channel/${firstChannel.id}`);
          }
        },
      });
    }

    // Users (friends)
    for (const user of c.users.toList()) {
      if (user.relationship !== "Friend") continue;
      const name = user.displayName ?? user.username ?? "";
      if (q && !name.toLowerCase().includes(q)) continue;
      items.push({
        id: `usr-${user.id}`,
        type: "user",
        name,
        detail: `@${user.username}`,
        icon: "person",
        action: () => {
          user.openDM().then((ch) => navigate(`/channel/${ch.id}`));
        },
      });
    }

    // Actions (always show if query matches or empty)
    const actions: { name: string; action: () => void }[] = [
      {
        name: t`Settings`,
        action: () => navigate("/settings"),
      },
    ];

    for (const act of actions) {
      if (q && !act.name.toLowerCase().includes(q)) continue;
      items.push({
        id: `act-${act.name}`,
        type: "action",
        name: act.name,
        icon: "settings",
        action: act.action,
      });
    }

    // Limit and sort: exact matches first
    return items
      .sort((a, b) => {
        if (!q) return 0;
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, 20);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const r = results();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, r.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = r[selectedIndex()];
      if (item) {
        item.action();
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const iconFor = (icon?: string) => {
    switch (icon) {
      case "voice":
        return <Volume2 />;
      case "person":
        return <User />;
      case "server":
        return <Server />;
      case "dm":
        return <MessageCircle />;
      case "settings":
        return <Settings />;
      default:
        return <Hash />;
    }
  };

  return (
    <Show when={open()}>
      <Portal mount={document.getElementById("floating")!}>
        <Scrim onClick={() => setOpen(false)}>
          <Palette onClick={(e) => e.stopPropagation()}>
            <SearchInput
              ref={inputRef}
              type="text"
              placeholder={t`Search channels, users, servers...`}
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
            <ResultsList>
              <Show when={results().length === 0}>
                <EmptyState>
                  <Trans>No results</Trans>
                </EmptyState>
              </Show>
              <For each={results()}>
                {(item, index) => (
                  <ResultItem
                    selected={index() === selectedIndex()}
                    onMouseEnter={() => setSelectedIndex(index())}
                    onClick={() => {
                      item.action();
                      setOpen(false);
                    }}
                  >
                    <ResultIcon>{iconFor(item.icon)}</ResultIcon>
                    <ResultText>
                      <ResultName>{item.name}</ResultName>
                      <Show when={item.detail}>
                        <ResultDetail>{item.detail}</ResultDetail>
                      </Show>
                    </ResultText>
                    <ResultType>
                      {item.type === "channel" ? t`Channel` :
                       item.type === "server" ? t`Server` :
                       item.type === "user" ? t`User` : t`Action`}
                    </ResultType>
                  </ResultItem>
                )}
              </For>
            </ResultsList>
            <Footer>
              <span>↑↓</span> <Trans>navigate</Trans>
              <span style={{ "margin-left": "12px" }}>↵</span> <Trans>select</Trans>
              <span style={{ "margin-left": "12px" }}>esc</span> <Trans>close</Trans>
            </Footer>
          </Palette>
        </Scrim>
      </Portal>
    </Show>
  );
}

const Scrim = styled("div", {
  base: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "15vh",
    background: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    animationName: "fadeIn",
    animationDuration: "0.1s",
  },
});

const Palette = styled("div", {
  base: {
    width: "560px",
    maxHeight: "440px",
    borderRadius: "14px",
    background: "var(--md-sys-color-surface-container-low)",
    border: "1px solid var(--pd-border-default)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.30)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "modalIn var(--pd-transition-base)",
  },
});

const SearchInput = styled("input", {
  base: {
    padding: "16px 20px",
    fontSize: "15px",
    letterSpacing: "-0.005em",
    fontFamily: "inherit",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--md-sys-color-on-surface)",
    borderBottom: "1px solid var(--pd-border-subtle)",
    "&::placeholder": {
      color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
    },
  },
});

const ResultsList = styled("div", {
  base: {
    overflow: "auto",
    flex: 1,
    padding: "4px",
  },
});

const ResultItem = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "var(--md-sys-color-on-surface)",
    transition: "background var(--pd-transition-fast)",

    "&:hover": {
      background: "var(--pd-tint-subtle)",
    },
  },
  variants: {
    selected: {
      true: {
        background: "var(--pd-tint-hover) !important",
        color: "var(--md-sys-color-on-surface)",
        fill: "var(--md-sys-color-on-surface)",
      },
    },
  },
});

const ResultIcon = styled("div", {
  base: {
    flexShrink: 0,
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      width: "20px",
      height: "20px",
    },
  },
});

const ResultText = styled("div", {
  base: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
});

const ResultName = styled("span", {
  base: {
    fontWeight: 500,
    fontSize: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

const ResultDetail = styled("span", {
  base: {
    fontSize: "12px",
    opacity: 0.6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

const ResultType = styled("span", {
  base: {
    fontSize: "11px",
    opacity: 0.5,
    flexShrink: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
});

const EmptyState = styled("div", {
  base: {
    padding: "24px",
    textAlign: "center",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "14px",
  },
});

const Footer = styled("div", {
  base: {
    padding: "10px 16px",
    fontSize: "12px",
    letterSpacing: "-0.005em",
    color: "var(--md-sys-color-on-surface-variant)",
    borderTop: "1px solid var(--pd-border-subtle)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    "& span": {
      fontFamily: "var(--qp-font-mono, monospace)",
      padding: "2px 6px",
      borderRadius: "4px",
      background: "var(--md-sys-color-surface-container)",
      border: "1px solid var(--pd-border-subtle)",
      fontSize: "11px",
    },
  },
});
