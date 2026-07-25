import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Button, Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

/**
 * Giveaways — create and manage giveaways
 */
export function Giveaways(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const [prize, setPrize] = createSignal("");
  const [channelId, setChannelId] = createSignal("");
  const [duration, setDuration] = createSignal("1h");
  const [winners, setWinners] = createSignal(1);
  const [sending, setSending] = createSignal(false);

  const channels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice);

  const DURATIONS: Record<string, string> = {
    "15m": t`15 minutes`,
    "1h": t`1 hour`,
    "6h": t`6 hours`,
    "12h": t`12 hours`,
    "1d": t`1 day`,
    "3d": t`3 days`,
    "7d": t`7 days`,
  };

  function durationToMs(d: string): number {
    const map: Record<string, number> = {
      "15m": 15 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "12h": 12 * 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
      "3d": 3 * 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    return map[d] ?? 60 * 60 * 1000;
  }

  async function createGiveaway() {
    if (!prize().trim() || !channelId() || sending()) return;
    setSending(true);

    try {
      const channel = client()!.channels.get(channelId());
      if (!channel) return;

      const endTime = new Date(Date.now() + durationToMs(duration()));
      const endStr = endTime.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const content = [
        `🎉 **${t`GIVEAWAY`}** 🎉`,
        "",
        `**${t`Prize`}:** ${prize().trim()}`,
        `**${t`Winners`}:** ${winners()}`,
        `**${t`Ends`}:** ${endStr}`,
        "",
        t`React with 🎉 to enter!`,
      ].join("\n");

      const msg = await channel.sendMessage(content);

      // Auto-add the giveaway reaction
      try {
        await msg.react("🎉");
      } catch {}

      setPrize("");
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <Column gap="xl">
      <Column>
        <Text class="label" size="large">
          <Trans>Giveaways</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Create a giveaway — a message will be posted in the selected
            channel. Members react with 🎉 to enter.
          </Trans>
        </Text>
      </Column>

      <Column gap="md">
        <InputField
          type="text"
          placeholder={t`Prize (e.g. Discord Nitro, game key)`}
          value={prize()}
          onInput={(e) => setPrize(e.currentTarget.value)}
        />

        <Row align gap="sm" style={{ "flex-wrap": "wrap" }}>
          <SelectField
            value={channelId()}
            onChange={(e) => setChannelId(e.currentTarget.value)}
          >
            <option value="">{t`Select channel`}</option>
            <For each={channels()}>
              {(ch) => <option value={ch.id}>#{ch.name}</option>}
            </For>
          </SelectField>

          <SelectField
            value={duration()}
            onChange={(e) => setDuration(e.currentTarget.value)}
          >
            {Object.entries(DURATIONS).map(([val, label]) => (
              <option value={val}>{label}</option>
            ))}
          </SelectField>

          <Row align gap="xs">
            <Text class="body" size="small">
              <Trans>Winners:</Trans>
            </Text>
            <NumberInput
              type="number"
              min={1}
              max={20}
              value={winners()}
              onInput={(e) => setWinners(+e.currentTarget.value)}
            />
          </Row>
        </Row>

        <Row>
          <Button
            onPress={createGiveaway}
            isDisabled={!prize().trim() || !channelId() || sending()}
          >
            <Symbol size={18}>celebration</Symbol>
            <Trans>Start Giveaway</Trans>
          </Button>
        </Row>
      </Column>

      <Column>
        <Text class="label">
          <Trans>How to pick winners</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            When the giveaway ends, go to the message, click the 🎉 reaction
            count to see participants, and use a random picker to select
            winners. A future update will automate this.
          </Trans>
        </Text>
      </Column>
    </Column>
  );
}

const InputField = styled("input", {
  base: {
    padding: "10px 12px",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "14px",
    outline: "none",
    "&:focus": { borderColor: "var(--md-sys-color-primary)" },
  },
});

const SelectField = styled("select", {
  base: {
    padding: "8px 10px",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
  },
});

const NumberInput = styled("input", {
  base: {
    width: "50px",
    padding: "6px 8px",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
    textAlign: "center",
  },
});
