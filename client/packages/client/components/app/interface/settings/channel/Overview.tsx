import { createFormControl, createFormGroup } from "solid-forms";
import { Match, Show, Switch, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import type { API } from "stoat.js";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { Button, Checkbox, CircularProgress, Column, Form2, Row, Text } from "@revolt/ui";

import { ChannelSettingsProps } from "../ChannelSettings";

const SLOWMODE_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 300, label: "5m" },
  { value: 900, label: "15m" },
  { value: 3600, label: "1h" },
];

/**
 * Channel overview
 */
export default function ChannelOverview(props: ChannelSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  /* eslint-disable solid/reactivity */
  // we want to take the initial value only
  const editGroup = createFormGroup({
    name: createFormControl(props.channel.name),
    description: createFormControl(props.channel.description || ""),
    icon: createFormControl<string | File[] | null>(
      props.channel.animatedIconURL,
    ),
  });
  /* eslint-enable solid/reactivity */

  function onReset() {
    editGroup.controls.name.setValue(props.channel.name);
    editGroup.controls.description.setValue(props.channel.description || "");
    editGroup.controls.icon.setValue(props.channel.animatedIconURL ?? null);
  }

  async function onSubmit() {
    const changes: API.DataEditChannel = {
      remove: [],
    };

    if (editGroup.controls.name.isDirty) {
      changes.name = editGroup.controls.name.value.trim();
    }

    if (editGroup.controls.description.isDirty) {
      const description = editGroup.controls.description.value.trim();

      if (description) {
        changes.description = description;
      } else {
        changes.remove!.push("Description");
      }
    }

    if (editGroup.controls.icon.isDirty) {
      if (!editGroup.controls.icon.value) {
        changes.remove!.push("Icon");
      } else if (Array.isArray(editGroup.controls.icon.value)) {
        const body = new FormData();
        body.append("file", editGroup.controls.icon.value[0]);

        const [key, value] = client().authenticationHeader;
        const data: { id: string } = await fetch(
          `${CONFIGURATION.DEFAULT_MEDIA_URL}/icons`,
          {
            method: "POST",
            body,
            headers: {
              [key]: value,
            },
          },
        ).then((res) => res.json());

        changes.icon = data.id;
      }
    }

    await props.channel.edit(changes);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column gap="xl">
      <form onSubmit={submit}>
        <Column>
          <Text class="label">
            <Trans>Channel Info</Trans>
          </Text>
          <Form2.FileInput control={editGroup.controls.icon} accept="image/*" />
          <Form2.TextField
            name="name"
            control={editGroup.controls.name}
            label={t`Channel Name`}
          />
          <Form2.TextField
            autosize
            min-rows={2}
            name="description"
            control={editGroup.controls.description}
            label={t`Channel Description`}
            placeholder={t`This channel is about...`}
          />
          <Row>
            <Form2.Reset group={editGroup} onReset={onReset} />
            <Form2.Submit group={editGroup} requireDirty>
              <Trans>Save</Trans>
            </Form2.Submit>
            <Show when={editGroup.isPending}>
              <CircularProgress />
            </Show>
          </Row>
        </Column>
      </form>
      <Column>
        <Text class="label">
          <Trans>Slowmode</Trans>
        </Text>
        <Text class="body" size="small">
          <Trans>Limit how often users can send messages in this channel</Trans>
        </Text>
        <SlowmodeSelect
          value={(props.channel as any).slowmode ?? 0}
          onChange={async (val: number) => {
            try {
              await props.channel.edit({ slowmode: val } as any);
            } catch {}
          }}
        />
      </Column>
      <Column>
        <Text class="label">
          <Trans>Mark as Mature</Trans>
        </Text>
        <Text>
          <Trans>
            Users will be asked to confirm their age before opening this
            channel.
          </Trans>
        </Text>
        <div>
          <Button
            onPress={() =>
              openModal({
                type: "channel_toggle_mature",
                channel: props.channel,
              })
            }
          >
            <Switch fallback={<Trans>Mark as Mature</Trans>}>
              <Match when={props.channel.mature}>
                <Trans>Unmark as Mature</Trans>
              </Match>
            </Switch>
          </Button>
        </div>
      </Column>
    </Column>
  );
}

function SlowmodeSelect(props: {
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        "flex-wrap": "wrap",
      }}
    >
      {SLOWMODE_OPTIONS.map((opt) => (
        <button
          onClick={() => props.onChange(opt.value)}
          style={{
            padding: "6px 14px",
            "border-radius": "16px",
            border:
              props.value === opt.value
                ? "1px solid var(--md-sys-color-primary)"
                : "1px solid var(--md-sys-color-outline-variant)",
            background:
              props.value === opt.value
                ? "var(--md-sys-color-primary)"
                : "transparent",
            color:
              props.value === opt.value
                ? "var(--md-sys-color-on-primary)"
                : "var(--md-sys-color-on-surface)",
            cursor: "pointer",
            "font-size": "13px",
            "font-weight": "500",
            transition: "background-color var(--pd-transition-fast), border-color var(--pd-transition-fast), color var(--pd-transition-fast), box-shadow var(--pd-transition-fast)",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
