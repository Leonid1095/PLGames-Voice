import { Show, createSignal } from "solid-js";

import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useActivityLabel } from "@revolt/common";
import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

type Kind = "Playing" | "Streaming" | "Listening" | "Watching" | "Competing";

const KIND_OPTIONS: Kind[] = [
  "Playing",
  "Streaming",
  "Listening",
  "Watching",
  "Competing",
];

/**
 * Modal for editing user's rich activity (game / stream / music / ...).
 */
export function ActivityModal(
  props: DialogProps & Modals & { type: "activity" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const existing = props.client.user?.activity;

  const [kind, setKind] = createSignal<Kind>(
    (existing?.kind as Kind) ?? "Playing",
  );

  /* eslint-disable solid/reactivity */
  const group = createFormGroup({
    name: createFormControl(existing?.name ?? ""),
    details: createFormControl(existing?.details ?? ""),
    state: createFormControl(existing?.state ?? ""),
    url: createFormControl(existing?.url ?? ""),
  });
  /* eslint-enable solid/reactivity */

  async function onSubmit() {
    try {
      const name = group.controls.name.value.trim();
      if (!name) {
        await props.client.user!.setActivity(null);
      } else {
        const details = group.controls.details.value.trim();
        const state = group.controls.state.value.trim();
        const url = group.controls.url.value.trim();
        await props.client.user!.setActivity({
          kind: kind(),
          name,
          details: details || undefined,
          state: state || undefined,
          url: url || undefined,
          started_at: existing?.name === name ? existing?.started_at : Date.now(),
        });
      }
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  async function onClear() {
    try {
      await props.client.user!.setActivity(null);
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  const kindLabel = useActivityLabel();

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Set activity</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Clear</Trans>,
          onClick: () => {
            onClear();
            return false;
          },
        },
        {
          text: <Trans>Save</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <label>
            <Trans>Activity type</Trans>
            <select
              value={kind()}
              onChange={(e) => setKind(e.currentTarget.value as Kind)}
              style={{ width: "100%", padding: "8px", "margin-top": "4px" }}
            >
              {KIND_OPTIONS.map((k) => (
                <option value={k}>{kindLabel(k)}</option>
              ))}
            </select>
          </label>
          <Form2.TextField
            name="name"
            control={group.controls.name}
            label={t`Name (e.g. Dota 2)`}
          />
          <Form2.TextField
            name="details"
            control={group.controls.details}
            label={t`Details (e.g. Ranked Match)`}
          />
          <Form2.TextField
            name="state"
            control={group.controls.state}
            label={t`State (e.g. 2/5 in queue)`}
          />
          <Show when={kind() === "Streaming"}>
            <Form2.TextField
              name="url"
              control={group.controls.url}
              label={t`Stream link (Twitch / YouTube)`}
            />
          </Show>
        </Column>
      </form>
    </Dialog>
  );
}
