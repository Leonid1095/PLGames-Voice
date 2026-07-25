import { For, Show, createResource, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Button, Checkbox, Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  xp: number;
  level: number;
}

/**
 * XP / Leveling system settings
 */
export function Leveling(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const enabled = () => (props.server as any).leveling_enabled ?? false;

  async function toggleLeveling() {
    try {
      await props.server.edit({
        leveling_enabled: !enabled(),
      } as any);
    } catch (e) {
      showError(e);
    }
  }

  const [leaderboard] = createResource(
    () => enabled(),
    async (isEnabled) => {
      if (!isEnabled) return [];
      try {
        const res = await client().api.get(
          `/servers/${props.server.id}/leaderboard?limit=20` as any,
        );
        return (res as unknown as LeaderboardEntry[]) ?? [];
      } catch {
        return [];
      }
    },
  );

  return (
    <Column gap="xl">
      <Column>
        <Text class="label" size="large">
          <Trans>XP & Leveling</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Members earn XP for sending messages. Levels unlock roles and show
            on the leaderboard.
          </Trans>
        </Text>
        <Row align gap="md">
          <Checkbox checked={enabled()} onChange={toggleLeveling} />
          <Text>
            <Trans>Enable leveling system</Trans>
          </Text>
        </Row>
      </Column>

      <Show when={enabled()}>
        <Column>
          <Text class="label" size="large">
            <Trans>Leaderboard</Trans>
          </Text>
          <Show
            when={!leaderboard.loading && (leaderboard() ?? []).length > 0}
            fallback={
              <Text class="body" size="small">
                <Trans>No XP data yet — members earn XP by chatting.</Trans>
              </Text>
            }
          >
            <LeaderboardTable>
              <For each={leaderboard()}>
                {(entry, i) => (
                  <LeaderboardRow>
                    <Rank>{i() + 1}</Rank>
                    <Username>{entry.username}</Username>
                    <LevelBadge><Trans>Lv.</Trans>{entry.level}</LevelBadge>
                    <XpText>{entry.xp.toLocaleString()} <Trans>XP</Trans></XpText>
                  </LeaderboardRow>
                )}
              </For>
            </LeaderboardTable>
          </Show>
        </Column>
      </Show>
    </Column>
  );
}

const LeaderboardTable = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
});

const LeaderboardRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderRadius: "var(--pd-radius-sm)",
    background: "var(--md-sys-color-surface-container)",
    fontSize: "13px",
  },
});

const Rank = styled("span", {
  base: {
    fontWeight: 700,
    fontSize: "14px",
    minWidth: "24px",
    color: "var(--md-sys-color-primary)",
  },
});

const Username = styled("span", {
  base: {
    flex: 1,
    fontWeight: 500,
  },
});

const LevelBadge = styled("span", {
  base: {
    padding: "2px 8px",
    borderRadius: "var(--pd-radius-md)",
    fontSize: "11px",
    fontWeight: 600,
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
  },
});

const XpText = styled("span", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
    minWidth: "80px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
});
