import { For, Show, createResource, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { Header, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ChannelHeader } from "../ChannelHeader";
import { ChannelPageProps } from "../ChannelPage";

// Forum thread shape returned by the /channels/:id/threads endpoint.
// The API does not yet provide a typed schema; this captures the fields
// the UI actually reads. Widen as we discover more.
interface ForumThread {
  _id: string;
  name?: string;
  tags?: string[];
  last_message_id?: string;
}

/**
 * Forum channel view — shows thread cards
 */
export function ForumView(props: ChannelPageProps) {
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();

  const [sortOrder, setSortOrder] = createSignal<"latest" | "oldest">("latest");
  const [selectedTag, setSelectedTag] = createSignal<string | null>(null);
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [newTitle, setNewTitle] = createSignal("");
  const [newContent, setNewContent] = createSignal("");
  const [creating, setCreating] = createSignal(false);

  // The /threads endpoint isn't in stoat-api's typed route list, so going
  // through c.api.{get,post} serialises the request incorrectly (POST body
  // gets dropped into the query string → 422). Talk to the API directly
  // via fetch using the client's own auth header (X-Session-Token /
  // X-Bot-Token), which is the same one stoat-api uses internally.
  function api(path: string, init: RequestInit = {}): Promise<Response> {
    const url = (CONFIGURATION.DEFAULT_API_URL || "") + path;
    const c = client() as unknown as {
      authenticationHeader?: [string, string];
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    const [headerName, headerValue] = c.authenticationHeader ?? ["", ""];
    if (headerName && headerValue) headers[headerName] = headerValue;
    return fetch(url, { ...init, headers });
  }

  const [threadsFailed, setThreadsFailed] = createSignal(false);
  const [threads, { refetch }] = createResource(
    () => threadsFailed() ? null : props.channel.id,
    async (channelId) => {
      if (!channelId) return [];
      try {
        const r = await api(`/channels/${channelId}/threads`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const res = (await r.json()) as ForumThread[];
        return res || [];
      } catch {
        // API doesn't support /threads endpoint — stop retrying
        setThreadsFailed(true);
        return [] as ForumThread[];
      }
    },
  );

  const forumTags = () => props.channel.forum?.tags || [];

  const filteredThreads = () => {
    let list = threads() || [];
    const tag = selectedTag();
    if (tag) {
      list = list.filter((thread) => thread.tags?.includes(tag));
    }
    if (sortOrder() === "oldest") {
      list = [...list].reverse();
    }
    return list;
  };

  async function createThread() {
    const title = newTitle().trim();
    const content = newContent().trim();
    if (!title || !content) return;

    setCreating(true);
    try {
      const r = await api(`/channels/${props.channel.id}/threads`, {
        method: "POST",
        body: JSON.stringify({ name: title, content: content }),
      });
      if (!r.ok) {
        const bodyText = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${bodyText.slice(0, 200)}`);
      }
      const res = (await r.json()) as ForumThread;

      setNewTitle("");
      setNewContent("");
      setShowCreateForm(false);
      refetch();

      if (res?._id) {
        navigate(`/server/${props.channel.serverId}/channel/${res._id}`);
      }
    } catch (err) {
      console.error("[Forum] Failed to create thread:", err);
    } finally {
      setCreating(false);
    }
  }

  function formatTime(id: string) {
    try {
      const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
      let ts = 0;
      for (let i = 0; i < 10; i++) {
        ts = ts * 32 + ENCODING.indexOf(id[i].toUpperCase());
      }
      const date = new Date(ts);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return t`just now`;
      if (diffMin < 60) return t`${diffMin}m`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return t`${diffHr}h`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 30) return t`${diffDay}d`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  }

  return (
    <>
      <Header placement="primary">
        <ChannelHeader
          channel={props.channel}
          sidebarState={() => ({ state: "default" as const })}
          setSidebarState={() => {}}
        />
      </Header>

      <div
        class={css({
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "var(--gap-lg)",
          gap: "var(--gap-md)",
        })}
      >
        <Toolbar>
          <TagBar>
            <TagChip selected={selectedTag() === null} onClick={() => setSelectedTag(null)}>
              <Trans>All</Trans>
            </TagChip>
            <For each={forumTags()}>
              {(tag) => (
                <TagChip
                  selected={selectedTag() === tag.id}
                  onClick={() => setSelectedTag(selectedTag() === tag.id ? null : tag.id)}
                  style={tag.color ? { "--tag-color": tag.color } : undefined}
                >
                  {tag.name}
                </TagChip>
              )}
            </For>
          </TagBar>
          <ToolbarActions>
            <SortButton onClick={() => setSortOrder(sortOrder() === "latest" ? "oldest" : "latest")}>
              <Symbol size={18}>{sortOrder() === "latest" ? "arrow_downward" : "arrow_upward"}</Symbol>
              <span>{sortOrder() === "latest" ? <Trans>Newest</Trans> : <Trans>Oldest</Trans>}</span>
            </SortButton>
            <CreateButton onClick={() => setShowCreateForm(!showCreateForm())}>
              <Symbol size={18}>{showCreateForm() ? "close" : "add"}</Symbol>
              {showCreateForm() ? <Trans>Cancel</Trans> : <Trans>New thread</Trans>}
            </CreateButton>
          </ToolbarActions>
        </Toolbar>

        <Show when={showCreateForm()}>
          <CreateForm>
            <input
              class={formInput}
              placeholder={t`Thread title`}
              value={newTitle()}
              onInput={(e) => setNewTitle(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setShowCreateForm(false); }}
            />
            <textarea
              class={formTextarea}
              placeholder={t`First message...`}
              value={newContent()}
              onInput={(e) => setNewContent(e.currentTarget.value)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) createThread();
                if (e.key === "Escape") setShowCreateForm(false);
              }}
            />
            <FormActions>
              <Text class="body" size="small" style={{ opacity: 0.6 }}>Ctrl+Enter</Text>
              <SubmitButton onClick={createThread} disabled={creating() || !newTitle().trim() || !newContent().trim()}>
                <Symbol size={18}>send</Symbol>
                <Trans>Create thread</Trans>
              </SubmitButton>
            </FormActions>
          </CreateForm>
        </Show>

        <Show
          when={!threads.loading}
          fallback={<div class={css({ textAlign: "center", padding: "40px", color: "var(--md-sys-color-on-surface-variant)" })}><Trans>Loading...</Trans></div>}
        >
          <Show
            when={filteredThreads().length > 0}
            fallback={
              <EmptyState>
                <Symbol size={48}>forum</Symbol>
                <Text class="title" size="medium"><Trans>No threads yet</Trans></Text>
                <Text class="body" size="small"><Trans>Start the first thread</Trans></Text>
              </EmptyState>
            }
          >
            <ThreadGrid>
              <For each={filteredThreads()}>
                {(thread) => (
                  <ThreadCard onClick={() => navigate(`/server/${props.channel.serverId}/channel/${thread._id}`)}>
                    <ThreadTitle>{thread.name}</ThreadTitle>
                    <ThreadInfo>
                      <Show when={thread._id}>
                        <ThreadTime>
                          <Symbol size={14}>schedule</Symbol>
                          <span>{formatTime(thread._id)}</span>
                        </ThreadTime>
                      </Show>
                    </ThreadInfo>
                    <ThreadMeta>
                      <Show when={thread.tags?.length}>
                        <For each={thread.tags}>
                          {(tagId: string) => {
                            const tag = forumTags().find((t) => t.id === tagId);
                            return tag ? <MiniTag style={tag.color ? { background: tag.color } : undefined}>{tag.name}</MiniTag> : null;
                          }}
                        </For>
                      </Show>
                    </ThreadMeta>
                    <Show when={thread.last_message_id}>
                      <ThreadActivity>
                        <Symbol size={14}>chat_bubble</Symbol>
                        <span><Trans>Has replies</Trans></span>
                      </ThreadActivity>
                    </Show>
                  </ThreadCard>
                )}
              </For>
            </ThreadGrid>
          </Show>
        </Show>
      </div>
    </>
  );
}

const Toolbar = styled("div", { base: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--gap-md)", flexWrap: "wrap" } });
const TagBar = styled("div", { base: { display: "flex", gap: "6px", flexWrap: "wrap" } });
const TagChip = styled("button", { base: { padding: "4px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: "1px solid var(--md-sys-color-outline-variant)", background: "transparent", color: "var(--md-sys-color-on-surface)", transition: "all var(--transition-fast)", "&:hover": { background: "var(--md-sys-color-surface-container-high)" } }, variants: { selected: { true: { background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", borderColor: "var(--md-sys-color-primary)" } } } });
const ToolbarActions = styled("div", { base: { display: "flex", gap: "8px", alignItems: "center" } });
const SortButton = styled("button", { base: { display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: "none", background: "var(--md-sys-color-surface-container)", color: "var(--md-sys-color-on-surface)", transition: "all var(--transition-fast)", "&:hover": { background: "var(--md-sys-color-surface-container-high)" } } });
const CreateButton = styled("button", { base: { display: "flex", alignItems: "center", gap: "4px", padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", transition: "all var(--transition-fast)", "&:hover": { opacity: 0.9 } } });
const CreateForm = styled("div", { base: { display: "flex", flexDirection: "column", gap: "8px", padding: "16px", borderRadius: "var(--borderRadius-lg)", background: "var(--md-sys-color-surface-container)", border: "1px solid var(--md-sys-color-outline-variant)" } });
const formInput = css({ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-low)", color: "var(--md-sys-color-on-surface)", fontSize: "15px", fontWeight: 600, outline: "none", "&:focus": { borderColor: "var(--md-sys-color-primary)" } });
const formTextarea = css({ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--md-sys-color-outline-variant)", background: "var(--md-sys-color-surface-container-low)", color: "var(--md-sys-color-on-surface)", fontSize: "14px", outline: "none", resize: "vertical", minHeight: "60px", fontFamily: "inherit", "&:focus": { borderColor: "var(--md-sys-color-primary)" } });
const FormActions = styled("div", { base: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" } });
const SubmitButton = styled("button", { base: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", transition: "all var(--transition-fast)", "&:hover": { opacity: 0.9 }, "&:disabled": { opacity: 0.5, cursor: "not-allowed" } } });
const ThreadGrid = styled("div", { base: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--gap-md)" } });
const ThreadCard = styled("div", { base: { display: "flex", flexDirection: "column", gap: "8px", padding: "16px", borderRadius: "var(--borderRadius-lg)", background: "var(--md-sys-color-surface-container)", cursor: "pointer", transition: "all var(--transition-fast)", border: "1px solid transparent", "&:hover": { background: "var(--md-sys-color-surface-container-high)", borderColor: "var(--md-sys-color-outline-variant)" } } });
const ThreadTitle = styled("div", { base: { fontSize: "15px", fontWeight: 600, color: "var(--md-sys-color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } });
const ThreadInfo = styled("div", { base: { display: "flex", gap: "12px", alignItems: "center", fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)" } });
const ThreadTime = styled("span", { base: { display: "inline-flex", alignItems: "center", gap: "4px" } });
const ThreadMeta = styled("div", { base: { display: "flex", gap: "4px", flexWrap: "wrap" } });
const MiniTag = styled("span", { base: { padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, background: "var(--md-sys-color-secondary-container)", color: "var(--md-sys-color-on-secondary-container)" } });
const ThreadActivity = styled("div", { base: { display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)" } });
const EmptyState = styled("div", { base: { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--gap-md)", padding: "60px 20px", color: "var(--md-sys-color-on-surface-variant)", textAlign: "center" } });
