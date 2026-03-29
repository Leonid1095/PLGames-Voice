import { For, Show, createMemo, createResource } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

/**
 * Server analytics — member stats, activity overview
 */
export function Analytics(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();

  const memberCount = createMemo(() => {
    // Count from channels member list
    try {
      return props.server.channels.length;
    } catch {
      return 0;
    }
  });

  const channelCount = () => props.server.channels.length;
  const roleCount = () => Object.keys(props.server.roles ?? {}).length;
  const emojiCount = () => {
    try {
      return [...(client()?.emojis.values() ?? [])].filter(
        (e) => (e as any).parent?.id === props.server.id,
      ).length;
    } catch {
      return 0;
    }
  };

  const categories = () => props.server.categories ?? [];

  const textChannels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice).length;

  const voiceChannels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => ch.isVoice).length;

  const createdDate = () => {
    try {
      const ts = parseInt(props.server.id.substring(0, 8), 36);
      return new Date(ts).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <Column gap="xl">
      <Text class="label" size="large">
        <Trans>Server Analytics</Trans>
      </Text>

      {/* Quick Stats */}
      <StatsGrid>
        <StatCard>
          <StatIcon>
            <Symbol size={24}>group</Symbol>
          </StatIcon>
          <StatValue>{channelCount()}</StatValue>
          <StatLabel>
            <Trans>Channels</Trans>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <Symbol size={24}>tag</Symbol>
          </StatIcon>
          <StatValue>{textChannels()}</StatValue>
          <StatLabel>
            <Trans>Text</Trans>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <Symbol size={24}>volume_up</Symbol>
          </StatIcon>
          <StatValue>{voiceChannels()}</StatValue>
          <StatLabel>
            <Trans>Voice</Trans>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <Symbol size={24}>shield</Symbol>
          </StatIcon>
          <StatValue>{roleCount()}</StatValue>
          <StatLabel>
            <Trans>Roles</Trans>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <Symbol size={24}>emoticon</Symbol>
          </StatIcon>
          <StatValue>{emojiCount()}</StatValue>
          <StatLabel>
            <Trans>Emojis</Trans>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>
            <Symbol size={24}>category</Symbol>
          </StatIcon>
          <StatValue>{categories().length}</StatValue>
          <StatLabel>
            <Trans>Categories</Trans>
          </StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Server Info */}
      <Column>
        <Text class="label">
          <Trans>Server Info</Trans>
        </Text>
        <InfoRow>
          <InfoLabel>
            <Trans>Created</Trans>
          </InfoLabel>
          <InfoValue>{createdDate()}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>
            <Trans>Server ID</Trans>
          </InfoLabel>
          <InfoValue style={{ "font-family": "monospace", "font-size": "12px" }}>
            {props.server.id}
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>
            <Trans>Owner</Trans>
          </InfoLabel>
          <InfoValue>
            {client()?.users.get(props.server.ownerId)?.username ?? props.server.ownerId}
          </InfoValue>
        </InfoRow>
        <Show when={(props.server as any).leveling_enabled}>
          <InfoRow>
            <InfoLabel><Trans>XP System</Trans></InfoLabel>
            <InfoValue style={{ color: "var(--brand-presence-online)" }}>
              <Trans>Enabled</Trans>
            </InfoValue>
          </InfoRow>
        </Show>
      </Column>

      {/* Feature Status */}
      <Column>
        <Text class="label">
          <Trans>Active Features</Trans>
        </Text>
        <FeatureGrid>
          <FeatureChip active={!!(props.server as any).leveling_enabled}>
            <Trans>XP/Levels</Trans>
          </FeatureChip>
          <FeatureChip active={(((props.server as any).auto_roles) ?? []).length > 0}>
            <Trans>Auto Roles</Trans>
          </FeatureChip>
          <FeatureChip active={!!(props.server as any).welcome_message}>
            <Trans>Welcome Msg</Trans>
          </FeatureChip>
          <FeatureChip active={!!(props.server as any).starboard}>
            <Trans>Starboard</Trans>
          </FeatureChip>
          <FeatureChip active={!!(props.server as any).automod}>
            <Trans>Automod</Trans>
          </FeatureChip>
          <FeatureChip active={(((props.server as any).reaction_roles) ?? []).length > 0}>
            <Trans>Reaction Roles</Trans>
          </FeatureChip>
        </FeatureGrid>
      </Column>
    </Column>
  );
}

const StatsGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "8px",
  },
});

const StatCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "16px 8px",
    borderRadius: "12px",
    background: "var(--md-sys-color-surface-container)",
  },
});

const StatIcon = styled("div", {
  base: {
    color: "var(--md-sys-color-primary)",
    opacity: 0.8,
  },
});

const StatValue = styled("div", {
  base: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--md-sys-color-on-surface)",
    fontVariantNumeric: "tabular-nums",
  },
});

const StatLabel = styled("div", {
  base: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--md-sys-color-on-surface-variant)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
});

const InfoRow = styled("div", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    fontSize: "13px",
  },
});

const InfoLabel = styled("span", {
  base: {
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const InfoValue = styled("span", {
  base: {
    fontWeight: 500,
  },
});

const FeatureGrid = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
});

const FeatureChip = styled("span", {
  base: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 500,
  },
  variants: {
    active: {
      true: {
        background: "color-mix(in srgb, var(--brand-presence-online) 20%, transparent)",
        color: "var(--brand-presence-online)",
      },
      false: {
        background: "var(--md-sys-color-surface-container)",
        color: "var(--md-sys-color-on-surface-variant)",
        opacity: 0.6,
      },
    },
  },
});
