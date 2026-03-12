import { Show, createSignal } from "solid-js";
import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useNavigate } from "@revolt/routing";
import { Checkbox, Column, Dialog, DialogProps, Form2, Radio2, Row, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

const TRIGGER_MARKER = "[TRIGGER:TEMP_VOICE]";

/**
 * Modal to create a new server channel
 */
export function CreateChannelModal(
  props: DialogProps & Modals & { type: "create_channel" },
) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { showError } = useModals();

  const [isTrigger, setIsTrigger] = createSignal(false);

  const group = createFormGroup({
    name: createFormControl("", { required: true }),
    type: createFormControl("Text"),
  });

  async function onSubmit() {
    try {
      const isVoice = group.controls.type.value === "Voice";
      const description = isVoice && isTrigger() ? TRIGGER_MARKER : undefined;

      const channel = await props.server.createChannel({
        type: group.controls.type.value as "Text" | "Voice",
        name: group.controls.name.value,
        ...(description ? { description } : {}),
      });

      if (props.cb) {
        props.cb(channel);
      } else {
        navigate(`/server/${props.server.id}/channel/${channel.id}`);
      }

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create channel</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Create</Trans>,
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
          <Form2.TextField
            name="name"
            control={group.controls.name}
            label={t`Channel Name`}
          />

          <Form2.Radio control={group.controls.type}>
            <Radio2.Option value="Text">
              <Trans>Text Channel</Trans>
            </Radio2.Option>
            <Radio2.Option value="Voice">
              <Trans>Voice Channel</Trans>
            </Radio2.Option>
          </Form2.Radio>

          <Show when={group.controls.type.value === "Voice"}>
            <Row align gap="md">
              <Checkbox
                checked={isTrigger()}
                onChange={() => setIsTrigger(!isTrigger())}
              />
              <Column gap="none">
                <Text class="label">
                  <Trans>Trigger for temporary channels</Trans>
                </Text>
                <Text class="body" size="small">
                  <Trans>Users who join this channel will automatically get a personal voice channel</Trans>
                </Text>
              </Column>
            </Row>
          </Show>
        </Column>
      </form>
    </Dialog>
  );
}
