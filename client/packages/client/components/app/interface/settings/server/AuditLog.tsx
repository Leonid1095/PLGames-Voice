import { For, Show, createSignal, createResource } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useClient } from "@revolt/client";
import { Button, CircularProgress, Column, Row, Text } from "@revolt/ui";

import { ServerSettingsProps } from "../ServerSettings";

interface AuditLogEntry {
  _id: string;
  server: string;
  user: string;
  action_type: string;
  target_type: string;
  target_id: string;
  changes?: unknown;
  reason?: string;
  timestamp: string;
}

// ACTION_LABELS must be inside the component to use t() macro
function useActionLabels() {
  const { t } = useLingui();
  return {
    ChannelCreate: t`Channel created`,
    ChannelDelete: t`Channel deleted`,
    ChannelUpdate: t`Channel updated`,
    RoleCreate: t`Role created`,
    RoleDelete: t`Role deleted`,
    RoleUpdate: t`Role updated`,
    MemberKick: t`Member kicked`,
    MemberBan: t`Member banned`,
    MemberUnban: t`Member unbanned`,
    ServerUpdate: t`Server updated`,
    EmojiCreate: t`Emoji created`,
    EmojiDelete: t`Emoji deleted`,
    WebhookCreate: t`Webhook created`,
    WebhookDelete: t`Webhook deleted`,
    MessagePin: t`Message pinned`,
    MessageUnpin: t`Message unpinned`,
  } as Record<string, string>;
}

/**
 * Audit Log settings page
 */
export function AuditLog(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const ACTION_LABELS = useActionLabels();
  const [before, setBefore] = createSignal<string | undefined>();
  const [allEntries, setAllEntries] = createSignal<AuditLogEntry[]>([]);

  const [apiUnsupported, setApiUnsupported] = createSignal(false);

  const [entries, { refetch }] = createResource(
    () => ({ before: before() }),
    async (params) => {
      const query = new URLSearchParams();
      query.set("limit", "50");
      if (params.before) query.set("before", params.before);

      try {
        const res = await client().api.get(
          `/servers/${props.server.id}/audit-log?${query.toString()}` as any,
        );
        return res as unknown as AuditLogEntry[];
      } catch {
        setApiUnsupported(true);
        return [];
      }
    },
  );

  // Merge new entries
  const mergedEntries = () => {
    const fetched = entries() ?? [];
    if (fetched.length > 0 && before()) {
      return [...allEntries(), ...fetched];
    }
    return fetched.length > 0 ? fetched : allEntries();
  };

  const resolveUser = (userId: string) => {
    const user = client().users.get(userId);
    return user?.username ?? userId.slice(0, 8) + "...";
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <Column>
      <Text class="label" size="large">
        <Trans>Audit Log</Trans>
      </Text>

      <Show when={entries.loading && allEntries().length === 0}>
        <CircularProgress />
      </Show>

      <Show when={apiUnsupported()}>
        <Text>
          <Trans>Audit log is not supported by this server version.</Trans>
        </Text>
      </Show>

      <Show when={!apiUnsupported() && mergedEntries().length === 0 && !entries.loading}>
        <Text>
          <Trans>No audit log entries found.</Trans>
        </Text>
      </Show>

      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "4px",
          width: "100%",
        }}
      >
        <For each={mergedEntries()}>
          {(entry) => (
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "12px",
                padding: "8px 12px",
                "border-radius": "8px",
                background: "var(--md-sys-color-surface-container)",
                "font-size": "13px",
              }}
            >
              <span
                style={{
                  "font-weight": "600",
                  "min-width": "180px",
                }}
              >
                {ACTION_LABELS[entry.action_type] ?? entry.action_type}
              </span>
              <span style={{ color: "var(--md-sys-color-primary)" }}>
                {resolveUser(entry.user)}
              </span>
              <span
                style={{
                  color: "var(--md-sys-color-on-surface-variant)",
                  "font-size": "12px",
                }}
              >
                {entry.target_type}: {entry.target_id.slice(0, 8)}...
              </span>
              <span
                style={{
                  "margin-left": "auto",
                  color: "var(--md-sys-color-on-surface-variant)",
                  "font-size": "12px",
                }}
              >
                {formatTime(entry.timestamp)}
              </span>
            </div>
          )}
        </For>
      </div>

      <Show when={mergedEntries().length >= 50}>
        <Row justify="center">
          <Button
            onPress={() => {
              const current = mergedEntries();
              setAllEntries(current);
              setBefore(current[current.length - 1]?._id);
              refetch();
            }}
          >
            <Trans>Load More</Trans>
          </Button>
        </Row>
      </Show>
    </Column>
  );
}
