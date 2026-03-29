import { Show, createSignal, onMount } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { styled } from "styled-system/jsx";

import { Dialog, DialogProps } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to create a new invite
 */
export function CreateInviteModal(
  props: DialogProps & Modals & { type: "create_invite" },
) {
  const { t } = useLingui();
  const { showError } = useModals();
  const [link, setLink] = createSignal("");
  const [copied, setCopied] = createSignal(false);

  const fetchInvite = useMutation(() => ({
    mutationFn: () =>
      props.channel
        .createInvite()
        .then(({ _id }) =>
          setLink(
            `${window.location.protocol}//${window.location.host}/invite/${_id}`,
          ),
        ),
    onError: showError,
  }));

  onMount(() => fetchInvite.mutate());

  function copyLink() {
    const url = link();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Invite to server</Trans>}
      actions={[{ text: <Trans>Done</Trans> }]}
    >
      <Wrapper>
        <Label>
          <Trans>Share this link to invite people to this server</Trans>
        </Label>

        <Show
          when={!fetchInvite.isPending}
          fallback={
            <LinkRow>
              <LinkInput>
                <LoadingText>{t`Generating link...`}</LoadingText>
              </LinkInput>
            </LinkRow>
          }
        >
          <LinkRow>
            <LinkInput onClick={copyLink}>
              <LinkText data-sensitive>{link()}</LinkText>
            </LinkInput>
            <CopyButton onClick={copyLink} copied={copied()}>
              <Show when={copied()} fallback={<Trans>Copy</Trans>}>
                <Symbol size={16}>check</Symbol>
                <Trans>Copied!</Trans>
              </Show>
            </CopyButton>
          </LinkRow>
        </Show>

        <Hint>
          <Trans>This invite link will not expire.</Trans>
        </Hint>
      </Wrapper>
    </Dialog>
  );
}

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
});

const Label = styled("div", {
  base: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const LinkRow = styled("div", {
  base: {
    display: "flex",
    gap: "0",
    borderRadius: "var(--borderRadius-md)",
    overflow: "hidden",
    border: "1px solid var(--md-sys-color-outline-variant)",
  },
});

const LinkInput = styled("div", {
  base: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    background: "var(--md-sys-color-surface-container)",
    cursor: "pointer",
    minWidth: 0,
    overflow: "hidden",

    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
});

const LinkText = styled("span", {
  base: {
    fontSize: "14px",
    fontFamily: "var(--fonts-monospace)",
    color: "var(--md-sys-color-primary)",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    userSelect: "all",
  },
});

const LoadingText = styled("span", {
  base: {
    fontSize: "14px",
    color: "var(--md-sys-color-on-surface-variant)",
    opacity: 0.6,
  },
});

const CopyButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "10px 16px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
    flexShrink: 0,
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",

    "&:hover": {
      filter: "brightness(1.1)",
    },
  },
  variants: {
    copied: {
      true: {
        background: "var(--md-sys-color-tertiary)",
        color: "var(--md-sys-color-on-tertiary)",
      },
    },
  },
});

const Hint = styled("div", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
    opacity: 0.7,
  },
});
