import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";
import { Button, Checkbox, Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

/**
 * Auto-moderation settings
 */
// Stoat.js types don't yet model these server-extension fields; we shape
// them locally to capture the actual API contract used in saveAutomod /
// saveStarboard below. Drop the `as ServerWithExtras` casts once
// stoat-api adds them to the typed schema.
interface AutomodConfig {
  blocked_words?: string[];
  spam_max_messages?: number;
  spam_interval_seconds?: number;
  spam_mute_duration?: number;
  block_duplicates?: boolean;
}
interface StarboardConfig {
  channel?: string;
  emoji?: string;
  threshold?: number;
}
interface ServerWithExtras {
  automod?: AutomodConfig;
  starboard?: StarboardConfig;
}
interface ServerEditExtras {
  automod?: AutomodConfig;
  starboard?: StarboardConfig;
  remove?: string[];
}

export function Automod(props: ServerSettingsProps) {
  const { t } = useLingui();
  const { showError } = useModals();

  const config = (): AutomodConfig =>
    (props.server as unknown as ServerWithExtras).automod ?? {};

  const [blockedWords, setBlockedWords] = createSignal(
    (config().blocked_words ?? []).join("\n"),
  );
  const [spamMax, setSpamMax] = createSignal(config().spam_max_messages ?? 5);
  const [spamInterval, setSpamInterval] = createSignal(
    config().spam_interval_seconds ?? 5,
  );
  const [spamMute, setSpamMute] = createSignal(
    config().spam_mute_duration ?? 300,
  );
  const [blockDupes, setBlockDupes] = createSignal(
    config().block_duplicates ?? false,
  );

  // Starboard
  const starboard = (): StarboardConfig | null =>
    (props.server as unknown as ServerWithExtras).starboard ?? null;
  const [sbChannel, setSbChannel] = createSignal(starboard()?.channel ?? "");
  const [sbEmoji, setSbEmoji] = createSignal(starboard()?.emoji ?? "⭐");
  const [sbThreshold, setSbThreshold] = createSignal(
    starboard()?.threshold ?? 3,
  );

  const channels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice);

  async function saveAutomod() {
    try {
      const words = blockedWords()
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const payload: ServerEditExtras = {
        automod: {
          blocked_words: words,
          spam_max_messages: spamMax(),
          spam_interval_seconds: spamInterval(),
          spam_mute_duration: spamMute(),
          block_duplicates: blockDupes(),
        },
      };
      await (props.server.edit as (p: ServerEditExtras) => Promise<void>)(payload);
    } catch (e) {
      showError(e);
    }
  }

  async function saveStarboard() {
    try {
      const edit = props.server.edit as (p: ServerEditExtras) => Promise<void>;
      if (!sbChannel()) {
        await edit({ remove: ["Starboard"] });
        return;
      }
      await edit({
        starboard: {
          channel: sbChannel(),
          emoji: sbEmoji() || "⭐",
          threshold: sbThreshold(),
        },
      });
    } catch (e) {
      showError(e);
    }
  }

  return (
    <Column gap="xl">
      {/* Blocked Words */}
      <Column>
        <Text class="label" size="large">
          <Trans>Blocked Words</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Messages containing these words will be automatically deleted. One
            word per line.
          </Trans>
        </Text>
        <textarea
          value={blockedWords()}
          onInput={(e) => setBlockedWords(e.currentTarget.value)}
          placeholder={t`bad_word\nanother_word`}
          rows={5}
          style={{
            padding: "10px",
            "border-radius": "8px",
            border: "1px solid var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container)",
            color: "var(--md-sys-color-on-surface)",
            "font-size": "13px",
            "font-family": "monospace",
            resize: "vertical",
          }}
        />
      </Column>

      {/* Spam Protection */}
      <Column>
        <Text class="label" size="large">
          <Trans>Spam Protection</Trans>
        </Text>
        <Row align gap="md">
          <SettingRow>
            <label>{t`Max messages`}</label>
            <NumberInput
              type="number"
              min={2}
              max={20}
              value={spamMax()}
              onInput={(e) => setSpamMax(+e.currentTarget.value)}
            />
          </SettingRow>
          <SettingRow>
            <label>{t`per seconds`}</label>
            <NumberInput
              type="number"
              min={1}
              max={30}
              value={spamInterval()}
              onInput={(e) => setSpamInterval(+e.currentTarget.value)}
            />
          </SettingRow>
          <SettingRow>
            <label>{t`Mute (sec)`}</label>
            <NumberInput
              type="number"
              min={10}
              max={86400}
              value={spamMute()}
              onInput={(e) => setSpamMute(+e.currentTarget.value)}
            />
          </SettingRow>
        </Row>
        <Row align gap="md">
          <Checkbox
            checked={blockDupes()}
            onChange={() => setBlockDupes(!blockDupes())}
          />
          <Text>
            <Trans>Block duplicate messages</Trans>
          </Text>
        </Row>
      </Column>

      <Row>
        <Button onPress={saveAutomod}>
          <Trans>Save Automod</Trans>
        </Button>
      </Row>

      {/* Starboard */}
      <Column>
        <Text class="label" size="large">
          <Trans>Starboard</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Messages with enough reactions get reposted to a highlight channel.
          </Trans>
        </Text>
        <SettingRow>
          <label>{t`Channel`}</label>
          <select
            value={sbChannel()}
            onChange={(e) => setSbChannel(e.currentTarget.value)}
            style={{
              padding: "6px 10px",
              "border-radius": "8px",
              border: "1px solid var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container)",
              color: "var(--md-sys-color-on-surface)",
              "font-size": "13px",
            }}
          >
            <option value="">{t`Disabled`}</option>
            <For each={channels()}>
              {(ch) => <option value={ch.id}>#{ch.name}</option>}
            </For>
          </select>
        </SettingRow>
        <Row align gap="md">
          <SettingRow>
            <label>{t`Emoji`}</label>
            <NumberInput
              type="text"
              value={sbEmoji()}
              onInput={(e) => setSbEmoji(e.currentTarget.value)}
              style={{ width: "60px", "text-align": "center" }}
            />
          </SettingRow>
          <SettingRow>
            <label>{t`Threshold`}</label>
            <NumberInput
              type="number"
              min={1}
              max={50}
              value={sbThreshold()}
              onInput={(e) => setSbThreshold(+e.currentTarget.value)}
            />
          </SettingRow>
        </Row>
        <Row>
          <Button onPress={saveStarboard}>
            <Trans>Save Starboard</Trans>
          </Button>
        </Row>
      </Column>
    </Column>
  );
}

const SettingRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const NumberInput = styled("input", {
  base: {
    width: "70px",
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
    textAlign: "center",
  },
});
