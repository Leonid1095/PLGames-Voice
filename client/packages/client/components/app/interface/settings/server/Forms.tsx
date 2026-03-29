import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Button, Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[]; // for select type
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  response_channel: string;
}

/**
 * Application forms — recruitment, feedback, etc.
 */
export function Forms(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const storageKey = () => `plg_forms_${props.server.id}`;

  function loadForms(): FormTemplate[] {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) ?? "[]");
    } catch {
      return [];
    }
  }

  function saveForms(forms: FormTemplate[]) {
    localStorage.setItem(storageKey(), JSON.stringify(forms));
    setForms(forms);
  }

  const [forms, setForms] = createSignal<FormTemplate[]>(loadForms());
  const [editing, setEditing] = createSignal<FormTemplate | null>(null);

  // Form builder state
  const [formName, setFormName] = createSignal("");
  const [formDesc, setFormDesc] = createSignal("");
  const [formChannel, setFormChannel] = createSignal("");
  const [fields, setFields] = createSignal<FormField[]>([
    { id: "1", label: "", type: "text", required: true },
  ]);

  const channels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice);

  function addField() {
    if (fields().length >= 10) return;
    setFields([
      ...fields(),
      {
        id: Date.now().toString(36),
        label: "",
        type: "text",
        required: false,
      },
    ]);
  }

  function removeField(id: string) {
    if (fields().length <= 1) return;
    setFields(fields().filter((f) => f.id !== id));
  }

  function updateField(id: string, key: string, value: any) {
    setFields(
      fields().map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    );
  }

  function saveForm() {
    if (!formName().trim() || !formChannel()) return;
    const validFields = fields().filter((f) => f.label.trim());
    if (validFields.length === 0) return;

    const template: FormTemplate = {
      id: editing()?.id ?? Date.now().toString(36),
      name: formName().trim(),
      description: formDesc().trim(),
      fields: validFields,
      response_channel: formChannel(),
    };

    if (editing()) {
      saveForms(forms().map((f) => (f.id === template.id ? template : f)));
    } else {
      saveForms([...forms(), template]);
    }

    resetBuilder();
  }

  function deleteForm(id: string) {
    saveForms(forms().filter((f) => f.id !== id));
  }

  function editForm(form: FormTemplate) {
    setFormName(form.name);
    setFormDesc(form.description);
    setFormChannel(form.response_channel);
    setFields(form.fields);
    setEditing(form);
  }

  function resetBuilder() {
    setFormName("");
    setFormDesc("");
    setFormChannel("");
    setFields([{ id: "1", label: "", type: "text", required: true }]);
    setEditing(null);
  }

  async function postFormLink(form: FormTemplate) {
    try {
      const channel = client()!.channels.get(form.response_channel);
      if (!channel) return;

      const requiredLabel = t`(required)`;
      const fieldList = form.fields
        .map((f) => `• ${f.label}${f.required ? ` *${requiredLabel}*` : ""}`)
        .join("\n");

      const fieldsLabel = t`Fields`;
      const submitHint = t`To submit an application, write your answers in this channel.`;
      await channel.sendMessage(
        `📋 **${form.name}**\n\n${form.description ? form.description + "\n\n" : ""}**${fieldsLabel}:**\n${fieldList}\n\n*${submitHint}*`,
      );
    } catch (e) {
      showError(e);
    }
  }

  return (
    <Column gap="xl">
      <Text class="label" size="large">
        <Trans>Application Forms</Trans>
      </Text>
      <Text class="body" size="small">
        <Trans>
          Create forms for recruitment, feedback, or applications. Responses
          are posted to a selected channel.
        </Trans>
      </Text>

      {/* Existing forms */}
      <Show when={forms().length > 0}>
        <Column gap="sm">
          <For each={forms()}>
            {(form) => (
              <FormCard>
                <Row align style={{ "justify-content": "space-between" }}>
                  <Column gap="none">
                    <Text style={{ "font-weight": "600" }}>{form.name}</Text>
                    <Text
                      class="body"
                      size="small"
                      style={{
                        color: "var(--md-sys-color-on-surface-variant)",
                      }}
                    >
                      {form.fields.length} {t`fields`} → #
                      {channels().find((c) => c.id === form.response_channel)
                        ?.name ?? "?"}
                    </Text>
                  </Column>
                  <Row gap="xs">
                    <SmallBtn onClick={() => postFormLink(form)}>
                      <Symbol size={16}>send</Symbol>
                    </SmallBtn>
                    <SmallBtn onClick={() => editForm(form)}>
                      <Symbol size={16}>edit</Symbol>
                    </SmallBtn>
                    <SmallBtn
                      onClick={() => deleteForm(form.id)}
                      style={{ color: "var(--md-sys-color-error)" }}
                    >
                      <Symbol size={16}>delete</Symbol>
                    </SmallBtn>
                  </Row>
                </Row>
              </FormCard>
            )}
          </For>
        </Column>
      </Show>

      {/* Form builder */}
      <BuilderCard>
        <Text class="label">
          {editing() ? <Trans>Edit Form</Trans> : <Trans>New Form</Trans>}
        </Text>

        <InputField
          type="text"
          placeholder={t`Form name (e.g. Clan Application)`}
          value={formName()}
          onInput={(e) => setFormName(e.currentTarget.value)}
        />

        <InputField
          type="text"
          placeholder={t`Description (optional)`}
          value={formDesc()}
          onInput={(e) => setFormDesc(e.currentTarget.value)}
        />

        <SelectField
          value={formChannel()}
          onChange={(e) => setFormChannel(e.currentTarget.value)}
        >
          <option value="">{t`Response channel`}</option>
          <For each={channels()}>
            {(ch) => <option value={ch.id}>#{ch.name}</option>}
          </For>
        </SelectField>

        <Column gap="xs">
          <Text
            class="body"
            size="small"
            style={{ "font-weight": "600" }}
          >
            <Trans>Fields</Trans>
          </Text>
          <For each={fields()}>
            {(field) => (
              <Row align gap="sm">
                <InputField
                  type="text"
                  placeholder={t`Field label`}
                  value={field.label}
                  onInput={(e) =>
                    updateField(field.id, "label", e.currentTarget.value)
                  }
                  style={{ flex: "1" }}
                />
                <SelectField
                  value={field.type}
                  onChange={(e) =>
                    updateField(field.id, "type", e.currentTarget.value)
                  }
                  style={{ width: "100px" }}
                >
                  <option value="text">{t`Short`}</option>
                  <option value="textarea">{t`Long`}</option>
                </SelectField>
                <label
                  style={{
                    "font-size": "11px",
                    display: "flex",
                    "align-items": "center",
                    gap: "4px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={() =>
                      updateField(field.id, "required", !field.required)
                    }
                  />
                  *
                </label>
                <Show when={fields().length > 1}>
                  <SmallBtn onClick={() => removeField(field.id)}>
                    <Symbol size={14}>close</Symbol>
                  </SmallBtn>
                </Show>
              </Row>
            )}
          </For>
          <Show when={fields().length < 10}>
            <AddBtn onClick={addField}>
              <Symbol size={14}>add</Symbol> <Trans>Add field</Trans>
            </AddBtn>
          </Show>
        </Column>

        <Row gap="sm">
          <Button
            onPress={saveForm}
            isDisabled={!formName().trim() || !formChannel()}
          >
            <Trans>Save Form</Trans>
          </Button>
          <Show when={editing()}>
            <Button onPress={resetBuilder} variant="plain">
              <Trans>Cancel</Trans>
            </Button>
          </Show>
        </Row>
      </BuilderCard>
    </Column>
  );
}

const FormCard = styled("div", {
  base: {
    padding: "12px",
    borderRadius: "10px",
    background: "var(--md-sys-color-surface-container)",
  },
});

const BuilderCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container-low)",
  },
});

const InputField = styled("input", {
  base: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
    outline: "none",
    "&:focus": { borderColor: "var(--md-sys-color-primary)" },
  },
});

const SelectField = styled("select", {
  base: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
  },
});

const SmallBtn = styled("button", {
  base: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--md-sys-color-on-surface-variant)",
    padding: "4px",
    display: "flex",
    "&:hover": { color: "var(--md-sys-color-on-surface)" },
  },
});

const AddBtn = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "1px dashed var(--md-sys-color-outline-variant)",
    borderRadius: "6px",
    padding: "6px 10px",
    color: "var(--md-sys-color-primary)",
    cursor: "pointer",
    fontSize: "12px",
  },
});
