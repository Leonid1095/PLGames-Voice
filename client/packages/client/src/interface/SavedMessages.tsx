import { For, Show, createSignal, onMount } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useNavigate } from "@revolt/routing";
import { Header, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

interface SavedMessage {
  id: string;
  channelId: string;
  serverId: string | null;
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
}

export function SavedMessages() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [messages, setMessages] = createSignal<SavedMessage[]>([]);
  const [search, setSearch] = createSignal("");

  onMount(() => {
    const saved = JSON.parse(localStorage.getItem("plg_saved_messages") || "[]");
    setMessages(saved);
  });

  function removeMessage(id: string) {
    const updated = messages().filter((m) => m.id !== id);
    setMessages(updated);
    localStorage.setItem("plg_saved_messages", JSON.stringify(updated));
  }

  function clearAll() {
    setMessages([]);
    localStorage.removeItem("plg_saved_messages");
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function goToMessage(msg: SavedMessage) {
    if (msg.serverId) {
      navigate(`/server/${msg.serverId}/channel/${msg.channelId}`);
    } else {
      navigate(`/channel/${msg.channelId}`);
    }
  }

  const filtered = () => {
    const q = search().toLowerCase();
    if (!q) return messages();
    return messages().filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q),
    );
  };

  return (
    <>
      <Header placement="primary">
        <div
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 16px",
            width: "100%",
          })}
        >
          <Symbol size={24}>bookmark</Symbol>
          <Text class="title" size="medium">
            <Trans>Saved messages</Trans>
          </Text>
          <span class={css({ marginLeft: "auto", fontSize: "13px", opacity: 0.6 })}>
            {filtered().length}
          </span>
        </div>
      </Header>

      <Container>
        <Toolbar>
          <SearchInput
            type="text"
            placeholder={t`Search saved messages...`}
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
          <Show when={messages().length > 0}>
            <ClearButton onClick={clearAll}>
              <Symbol size={16}>delete_sweep</Symbol>
              <Trans>Clear all</Trans>
            </ClearButton>
          </Show>
        </Toolbar>

        <Show
          when={filtered().length > 0}
          fallback={
            <EmptyState>
              <Symbol size={48}>bookmark_border</Symbol>
              <Text class="title" size="medium">
                <Trans>No saved messages</Trans>
              </Text>
              <Text class="body" size="small">
                <Trans>Right-click a message and choose "Save"</Trans>
              </Text>
            </EmptyState>
          }
        >
          <MessageList>
            <For each={filtered()}>
              {(msg) => (
                <MessageCard>
                  <CardHeader>
                    <Author>{msg.author}</Author>
                    <Time>{formatDate(msg.timestamp)}</Time>
                  </CardHeader>
                  <Content>{msg.content || <i><Trans>No text</Trans></i>}</Content>
                  <CardActions>
                    <ActionButton onClick={() => goToMessage(msg)}>
                      <Symbol size={16}>open_in_new</Symbol>
                      <Trans>Go to</Trans>
                    </ActionButton>
                    <ActionButton onClick={() => navigator.clipboard.writeText(msg.content)}>
                      <Symbol size={16}>content_copy</Symbol>
                      <Trans>Copy</Trans>
                    </ActionButton>
                    <ActionButton onClick={() => removeMessage(msg.id)} destructive>
                      <Symbol size={16}>close</Symbol>
                      <Trans>Delete</Trans>
                    </ActionButton>
                  </CardActions>
                </MessageCard>
              )}
            </For>
          </MessageList>
        </Show>
      </Container>
    </>
  );
}

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "var(--gap-lg)",
    gap: "var(--gap-md)",
  },
});

const Toolbar = styled("div", {
  base: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
});

const SearchInput = styled("input", {
  base: {
    flex: 1,
    padding: "8px 14px",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container-low)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "14px",
    outline: "none",
    "&:focus": { borderColor: "var(--md-sys-color-primary)" },
  },
});

const ClearButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 14px",
    borderRadius: "var(--pd-radius-sm)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "var(--md-sys-color-error-container)",
    color: "var(--md-sys-color-on-error-container)",
    "&:hover": { opacity: 0.9 },
  },
});

const MessageList = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
});

const MessageCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "12px 16px",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container)",
    border: "1px solid transparent",
    "&:hover": {
      borderColor: "var(--md-sys-color-outline-variant)",
    },
  },
});

const CardHeader = styled("div", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

const Author = styled("span", {
  base: {
    fontWeight: 600,
    fontSize: "14px",
    color: "var(--md-sys-color-primary)",
  },
});

const Time = styled("span", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const Content = styled("div", {
  base: {
    fontSize: "14px",
    color: "var(--md-sys-color-on-surface)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
});

const CardActions = styled("div", {
  base: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
  },
});

const ActionButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "var(--pd-radius-sm)",
    fontSize: "12px",
    cursor: "pointer",
    border: "none",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    "&:hover": { background: "var(--md-sys-color-surface-container-highest)" },
  },
  variants: {
    destructive: {
      true: {
        color: "var(--md-sys-color-error)",
        "&:hover": { background: "var(--md-sys-color-error-container)" },
      },
    },
  },
});

const EmptyState = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "60px 20px",
    color: "var(--md-sys-color-on-surface-variant)",
    textAlign: "center",
  },
});
