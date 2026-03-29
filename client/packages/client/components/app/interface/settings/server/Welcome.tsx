import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useModals } from "@revolt/modal";
import { Button, Checkbox, Column, Row, Text } from "@revolt/ui";

import { ServerSettingsProps } from "../ServerSettings";

/**
 * Welcome & auto-roles settings page
 */
export function Welcome(props: ServerSettingsProps) {
  const { t } = useLingui();
  const { showError } = useModals();

  const [welcomeMsg, setWelcomeMsg] = createSignal(
    (props.server as any).welcome_message ?? "",
  );

  const channels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice);

  const roles = () => props.server.orderedRoles?.filter((r) => r.id !== "default") ?? [];

  const autoRoles = () => (props.server as any).auto_roles ?? [];

  async function saveWelcome() {
    try {
      await props.server.edit({
        welcome_message: welcomeMsg() || undefined,
      } as any);
    } catch (e) {
      showError(e);
    }
  }

  async function toggleAutoRole(roleId: string) {
    try {
      const current: string[] = (props.server as any).auto_roles ?? [];
      const newRoles = current.includes(roleId)
        ? current.filter((r) => r !== roleId)
        : [...current, roleId];
      await props.server.edit({ auto_roles: newRoles } as any);
    } catch (e) {
      showError(e);
    }
  }

  return (
    <Column gap="xl">
      <Column>
        <Text class="label" size="large">
          <Trans>Welcome Message</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Customize the message sent when a new member joins. Use {"{user}"}
            for username, {"{server}"} for server name, {"{count}"} for member
            count.
          </Trans>
        </Text>
        <textarea
          value={welcomeMsg()}
          onInput={(e) => setWelcomeMsg(e.currentTarget.value)}
          placeholder={t`Welcome to {server}, {user}! You're member #{count}.`}
          rows={3}
          style={{
            padding: "10px",
            "border-radius": "8px",
            border: "1px solid var(--md-sys-color-outline-variant)",
            background: "var(--md-sys-color-surface-container)",
            color: "var(--md-sys-color-on-surface)",
            "font-size": "14px",
            resize: "vertical",
          }}
        />
        <Row>
          <Button onPress={saveWelcome}>
            <Trans>Save</Trans>
          </Button>
        </Row>
      </Column>

      <Column>
        <Text class="label" size="large">
          <Trans>Auto Roles</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>
            Roles automatically assigned to new members when they join.
          </Trans>
        </Text>
        <Column gap="sm">
          <For each={roles()}>
            {(role) => (
              <Row align gap="md">
                <Checkbox
                  checked={autoRoles().includes(role.id)}
                  onChange={() => toggleAutoRole(role.id)}
                />
                <Text
                  style={{
                    color: role.colour ?? "var(--md-sys-color-on-surface)",
                  }}
                >
                  {role.name}
                </Text>
              </Row>
            )}
          </For>
          <Show when={roles().length === 0}>
            <Text class="body" size="small">
              <Trans>No roles created yet</Trans>
            </Text>
          </Show>
        </Column>
      </Column>
    </Column>
  );
}
