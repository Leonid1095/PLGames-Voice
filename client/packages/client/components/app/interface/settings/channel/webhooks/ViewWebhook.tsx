import { createFormControl, createFormGroup } from "solid-forms";
import { Show } from "solid-js";
import { Copy, Trash2 } from "lucide-solid";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { API, ChannelWebhook } from "stoat.js";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import {
  CategoryButton,
  CircularProgress,
  Column,
  Form2,
  Row,
  Text,
} from "@revolt/ui";

import { useSettingsNavigation } from "../../Settings";

const NEWS_EXAMPLE = `{
  "news": {
    "title": "Новый рейд в субботу",
    "text": "Запись открыта до пятницы.",
    "url": "https://example.com/news/raid",
    "image": "https://example.com/news/raid.jpg"
  }
}`;

const CHAT_EXAMPLE = `{
  "chat": {
    "author": "Thrall",
    "text": "Сбор у ворот Орды"
  }
}`;

/**
 * Webhook
 */
export function ViewWebhook(props: { webhook: ChannelWebhook }) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();
  const { navigate } = useSettingsNavigation();

  /* eslint-disable solid/reactivity */
  const editGroup = createFormGroup({
    name: createFormControl(props.webhook.name),
    avatar: createFormControl<string | File[] | null>(props.webhook.avatarURL),
  });
  /* eslint-enable solid/reactivity */

  const deleteWebhook = useMutation(() => ({
    mutationFn: () => props.webhook.delete(),
    onSuccess() {
      navigate("webhooks");
    },
    onError: showError,
  }));

  async function onSubmit() {
    const changes: API.DataEditWebhook = {
      remove: [],
    };

    if (editGroup.controls.name.isDirty) {
      changes.name = editGroup.controls.name.value.trim();
    }

    if (editGroup.controls.avatar.isDirty) {
      if (!editGroup.controls.avatar.value) {
        changes.remove!.push("Avatar");
      } else if (Array.isArray(editGroup.controls.avatar.value)) {
        const body = new FormData();
        body.append("file", editGroup.controls.avatar.value[0]);

        const [key, value] = client().authenticationHeader;
        const data: { id: string } = await fetch(
          `${CONFIGURATION.DEFAULT_MEDIA_URL}/avatars`,
          {
            method: "POST",
            body,
            headers: {
              [key]: value,
            },
          },
        ).then((res) => res.json());

        changes.avatar = data.id;
      }
    }

    await props.webhook.edit(changes);
  }

  function onReset() {
    editGroup.controls.name.setValue(props.webhook.name);
    editGroup.controls.avatar.setValue(props.webhook.avatarURL ?? null);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  const webhookUrl = () =>
    props.webhook.token
      ? `${CONFIGURATION.DEFAULT_API_URL}/webhooks/${props.webhook.id}/${props.webhook.token}`
      : undefined;

  return (
    <Column gap="xl">
      <form onSubmit={submit}>
        <Column>
          <Form2.FileInput
            control={editGroup.controls.avatar}
            accept="image/*"
            label={t`Webhook Icon`}
            imageJustify={false}
          />
          <Form2.TextField
            name="name"
            control={editGroup.controls.name}
            label={t`Webhook Name`}
          />
          <Row>
            <Form2.Reset group={editGroup} onReset={onReset} />
            <Form2.Submit group={editGroup}>
              <Trans>Save</Trans>
            </Form2.Submit>
            <Show when={editGroup.isPending}>
              <CircularProgress />
            </Show>
          </Row>
        </Column>
      </form>

      <Column gap="md">
        <Text class="label">
          <Trans>
            Your site or game posts JSON to this URL. PLG Voice does not fetch
            either of them.
          </Trans>
        </Text>
        <Show
          when={webhookUrl()}
          fallback={
            <Text class="label">
              <Trans>
                This webhook has no token loaded. Create it again to get a URL.
              </Trans>
            </Text>
          }
        >
          <pre
            style={{
              margin: "0",
              "white-space": "pre-wrap",
              "overflow-wrap": "anywhere",
              "font-family": "var(--pd-font-mono, ui-monospace, monospace)",
              "font-size": "12px",
              "line-height": "1.45",
            }}
          >
            {webhookUrl()}
          </pre>
        </Show>
        <CategoryButton
          action="chevron"
          icon={<Copy />}
          disabled={!webhookUrl()}
          onClick={() => {
            const url = webhookUrl();
            if (url) navigator.clipboard.writeText(url);
          }}
        >
          <Trans>Copy webhook URL</Trans>
        </CategoryButton>
        <CategoryButton
          action="chevron"
          icon={<Copy />}
          onClick={() => navigator.clipboard.writeText(NEWS_EXAMPLE)}
        >
          <Trans>Copy news example</Trans>
        </CategoryButton>
        <pre
          style={{
            margin: "0",
            "white-space": "pre-wrap",
            "font-family": "var(--pd-font-mono, ui-monospace, monospace)",
            "font-size": "12px",
            "line-height": "1.45",
          }}
        >
          {NEWS_EXAMPLE}
        </pre>
        <CategoryButton
          action="chevron"
          icon={<Copy />}
          onClick={() => navigator.clipboard.writeText(CHAT_EXAMPLE)}
        >
          <Trans>Copy game chat example</Trans>
        </CategoryButton>
        <pre
          style={{
            margin: "0",
            "white-space": "pre-wrap",
            "font-family": "var(--pd-font-mono, ui-monospace, monospace)",
            "font-size": "12px",
            "line-height": "1.45",
          }}
        >
          {CHAT_EXAMPLE}
        </pre>
        <CategoryButton
          action="chevron"
          icon={<Trash2 />}
          disabled={deleteWebhook.isPending}
          onClick={() => deleteWebhook.mutate()}
        >
          <Trans>Delete webhook</Trans>
        </CategoryButton>
      </Column>
    </Column>
  );
}
