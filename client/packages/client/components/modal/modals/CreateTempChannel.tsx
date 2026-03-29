import { createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Column, Dialog, DialogProps, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { Modals } from "../types";

/**
 * Modal to configure and create a temporary voice channel
 */
export function CreateTempChannelModal(
  props: DialogProps & Modals & { type: "create_temp_channel" },
) {
  const { t } = useLingui();
  const [name, setName] = createSignal(props.defaultName || "");
  const [maxUsers, setMaxUsers] = createSignal(0);

  const presets = [0, 2, 5, 10, 15, 25];

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create temporary channel</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            props.onConfirm(name().trim() || props.defaultName, maxUsers() || undefined);
            return true;
          },
          isDisabled: !name().trim(),
        },
      ]}
    >
      <Column gap="md">
        <Column gap="sm">
          <Label>{t`Channel name`}</Label>
          <NameInput
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder={props.defaultName}
            maxLength={64}
            autofocus
          />
        </Column>

        <Column gap="sm">
          <Label>{t`User limit`}</Label>
          <PresetRow>
            {presets.map((n) => (
              <PresetButton
                active={maxUsers() === n}
                onClick={() => setMaxUsers(n)}
              >
                {n === 0 ? (
                  <Row align gap="xs">
                    <Symbol size={16}>all_inclusive</Symbol>
                    <span>{t`No limit`}</span>
                  </Row>
                ) : (
                  <Row align gap="xs">
                    <Symbol size={16}>group</Symbol>
                    <span>{n}</span>
                  </Row>
                )}
              </PresetButton>
            ))}
          </PresetRow>
          <HintText>
            <Trans>Set to 0 for unlimited participants</Trans>
          </HintText>
        </Column>
      </Column>
    </Dialog>
  );
}

const Label = styled("div", {
  base: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const NameInput = styled("input", {
  base: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: "inherit",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    outline: "none",
    transition: "border-color 0.15s",

    "&:focus": {
      borderColor: "var(--md-sys-color-primary)",
    },

    "&::placeholder": {
      color: "var(--md-sys-color-on-surface-variant)",
      opacity: 0.5,
    },
  },
});

const PresetRow = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
});

const PresetButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
    fontWeight: 500,
    transition: "all 0.15s",

    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
  variants: {
    active: {
      true: {
        background: "var(--md-sys-color-primary)",
        color: "var(--md-sys-color-on-primary)",
        borderColor: "var(--md-sys-color-primary)",

        "&:hover": {
          background: "var(--md-sys-color-primary)",
          filter: "brightness(1.1)",
        },
      },
    },
  },
});

const HintText = styled("div", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
    opacity: 0.7,
  },
});
