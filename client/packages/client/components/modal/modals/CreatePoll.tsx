import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Column, Dialog, DialogProps, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Modal to create a poll
 */
export function CreatePollModal(
  props: DialogProps & {
    type: "create_poll";
    onSubmit: (question: string, options: string[], multi: boolean) => void;
  },
) {
  const { t } = useLingui();
  const [question, setQuestion] = createSignal("");
  const [options, setOptions] = createSignal(["", ""]);
  const [multi, setMulti] = createSignal(false);

  function addOption() {
    if (options().length < 10) {
      setOptions([...options(), ""]);
    }
  }

  function removeOption(index: number) {
    if (options().length > 2) {
      setOptions(options().filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const newOpts = [...options()];
    newOpts[index] = value;
    setOptions(newOpts);
  }

  const validOptions = () => options().filter((o) => o.trim().length > 0);
  const canSubmit = () => question().trim().length > 0 && validOptions().length >= 2;

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create Poll</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Post Poll</Trans>,
          isDisabled: !canSubmit(),
          onClick: () => {
            props.onSubmit(question().trim(), validOptions(), multi());
            return true;
          },
        },
      ]}
    >
      <Column gap="md">
        <QuestionInput
          type="text"
          placeholder={t`Question`}
          value={question()}
          onInput={(e) => setQuestion(e.currentTarget.value)}
        />

        <Column gap="xs">
          <For each={options()}>
            {(opt, i) => (
              <Row align gap="sm">
                <OptionNumber>{i() + 1}.</OptionNumber>
                <OptionInput
                  type="text"
                  placeholder={`${t`Option`} ${i() + 1}`}
                  value={opt}
                  onInput={(e) => updateOption(i(), e.currentTarget.value)}
                />
                <Show when={options().length > 2}>
                  <RemoveBtn onClick={() => removeOption(i())}>
                    <Symbol size={16}>close</Symbol>
                  </RemoveBtn>
                </Show>
              </Row>
            )}
          </For>
        </Column>

        <Show when={options().length < 10}>
          <AddOptionBtn onClick={addOption}>
            <Symbol size={16}>add</Symbol>
            <Trans>Add option</Trans>
          </AddOptionBtn>
        </Show>

        <Row align gap="sm">
          <input
            type="checkbox"
            checked={multi()}
            onChange={() => setMulti(!multi())}
          />
          <Text class="body" size="small">
            <Trans>Allow multiple choices</Trans>
          </Text>
        </Row>
      </Column>
    </Dialog>
  );
}

const QuestionInput = styled("input", {
  base: {
    padding: "10px 12px",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "15px",
    fontWeight: 600,
    outline: "none",
    "&:focus": { borderColor: "var(--md-sys-color-primary)" },
  },
});

const OptionInput = styled("input", {
  base: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "var(--pd-radius-sm)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
    outline: "none",
    "&:focus": { borderColor: "var(--md-sys-color-primary)" },
  },
});

const OptionNumber = styled("span", {
  base: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface-variant)",
    minWidth: "20px",
  },
});

const RemoveBtn = styled("button", {
  base: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--md-sys-color-error)",
    padding: "4px",
    display: "flex",
  },
});

const AddOptionBtn = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "1px dashed var(--md-sys-color-outline-variant)",
    borderRadius: "var(--pd-radius-sm)",
    padding: "8px 12px",
    color: "var(--md-sys-color-primary)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    "&:hover": {
      background: "var(--md-sys-color-surface-container)",
    },
  },
});
