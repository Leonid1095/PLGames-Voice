import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";
import { Button, Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

interface ReactionRoleMapping {
  message_id: string;
  channel_id: string;
  emoji: string;
  role_id: string;
}

/**
 * Reaction roles settings — assign roles via reactions on messages
 */
export function ReactionRoles(props: ServerSettingsProps) {
  const { t } = useLingui();
  const { showError } = useModals();

  const mappings = (): ReactionRoleMapping[] =>
    (props.server as any).reaction_roles ?? [];

  const [newMsgId, setNewMsgId] = createSignal("");
  const [newChannelId, setNewChannelId] = createSignal("");
  const [newEmoji, setNewEmoji] = createSignal("");
  const [newRoleId, setNewRoleId] = createSignal("");

  const channels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice);

  const roles = () =>
    props.server.orderedRoles?.filter((r) => r.id !== "default") ?? [];

  async function addMapping() {
    if (!newMsgId() || !newChannelId() || !newEmoji() || !newRoleId()) return;
    try {
      const current = mappings();
      await props.server.edit({
        reaction_roles: [
          ...current,
          {
            message_id: newMsgId().trim(),
            channel_id: newChannelId(),
            emoji: newEmoji().trim(),
            role_id: newRoleId(),
          },
        ],
      } as any);
      setNewMsgId("");
      setNewEmoji("");
    } catch (e) {
      showError(e);
    }
  }

  async function removeMapping(index: number) {
    try {
      const current = [...mappings()];
      current.splice(index, 1);
      await props.server.edit({
        reaction_roles: current,
      } as any);
    } catch (e) {
      showError(e);
    }
  }

  const getRoleName = (roleId: string) =>
    roles().find((r) => r.id === roleId)?.name ?? roleId.slice(0, 8);

  const getChannelName = (channelId: string) =>
    channels().find((ch) => ch.id === channelId)?.name ?? channelId.slice(0, 8);

  return (
    <Column gap="xl">
      <Column>
        <Text class="label" size="large">
          <Trans>Reaction Roles</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Users react to a message with an emoji to get a role. Remove the
            reaction to lose the role.
          </Trans>
        </Text>
      </Column>

      {/* Existing mappings */}
      <Show when={mappings().length > 0}>
        <Column gap="sm">
          <For each={mappings()}>
            {(mapping, i) => (
              <MappingRow>
                <MappingInfo>
                  <span>{mapping.emoji}</span>
                  <span style={{ "font-weight": "600" }}>
                    → {getRoleName(mapping.role_id)}
                  </span>
                  <span
                    style={{
                      "font-size": "11px",
                      color: "var(--md-sys-color-on-surface-variant)",
                    }}
                  >
                    #{getChannelName(mapping.channel_id)}
                  </span>
                </MappingInfo>
                <button
                  onClick={() => removeMapping(i())}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--md-sys-color-error)",
                    padding: "4px",
                  }}
                >
                  <Symbol size={18}>close</Symbol>
                </button>
              </MappingRow>
            )}
          </For>
        </Column>
      </Show>

      {/* Add new mapping */}
      <Column>
        <Text class="label">
          <Trans>Add Reaction Role</Trans>
        </Text>
        <Row align gap="sm" style={{ "flex-wrap": "wrap" }}>
          <SelectField
            value={newChannelId()}
            onChange={(e) => setNewChannelId(e.currentTarget.value)}
          >
            <option value="">{t`Channel`}</option>
            <For each={channels()}>
              {(ch) => <option value={ch.id}>#{ch.name}</option>}
            </For>
          </SelectField>
          <InputField
            type="text"
            placeholder={t`Message ID`}
            value={newMsgId()}
            onInput={(e) => setNewMsgId(e.currentTarget.value)}
          />
          <InputField
            type="text"
            placeholder={t`Emoji`}
            value={newEmoji()}
            onInput={(e) => setNewEmoji(e.currentTarget.value)}
            style={{ width: "60px", "text-align": "center" }}
          />
          <SelectField
            value={newRoleId()}
            onChange={(e) => setNewRoleId(e.currentTarget.value)}
          >
            <option value="">{t`Role`}</option>
            <For each={roles()}>
              {(role) => <option value={role.id}>{role.name}</option>}
            </For>
          </SelectField>
        </Row>
        <Row>
          <Button
            onPress={addMapping}
            isDisabled={
              !newMsgId() || !newChannelId() || !newEmoji() || !newRoleId()
            }
          >
            <Trans>Add</Trans>
          </Button>
        </Row>
      </Column>
    </Column>
  );
}

const MappingRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: "8px",
    background: "var(--md-sys-color-surface-container)",
    fontSize: "13px",
  },
});

const MappingInfo = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
});

const SelectField = styled("select", {
  base: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
  },
});

const InputField = styled("input", {
  base: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
    width: "160px",
  },
});
