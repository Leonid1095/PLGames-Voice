import { Show } from "solid-js";
import { Flag, Settings, Smile, UserPlus } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";

import { useClient } from "@revolt/client";
import { Markdown } from "@revolt/markdown";
import {
  CategoryButton,
  CategoryButtonGroup,
  Column,
  Dialog,
  DialogProps,
  iconSize,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function ServerInfoModal(
  props: DialogProps & Modals & { type: "server_info" },
) {
  const client = useClient();
  const { openModal } = useModals();

  const canOpenSettings = () =>
    props.server.orPermission(
      "ManageServer",
      "ManageCustomisation",
      "ManageRole",
      "ManagePermissions",
    );

  const canInvite = () =>
    props.server.channels.find((ch) => ch.havePermission("InviteOthers"));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={props.server.name}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <Column gap="md">
        <Show when={props.server.banner}>
          <img
            src={props.server.bannerURL}
            alt=""
            class={css({
              width: "100%",
              height: "120px",
              objectFit: "cover",
              borderRadius: "var(--borderRadius-md)",
            })}
          />
        </Show>
        <Show when={props.server.description}>
          <Markdown content={props.server.description!} />
        </Show>
        <CategoryButtonGroup>
          <Show when={canInvite()}>
            <CategoryButton
              icon={<UserPlus {...iconSize(22)} />}
              action="chevron"
              onClick={() => {
                const channel = canInvite()!;
                props.onClose();
                openModal({
                  type: "create_invite",
                  channel,
                });
              }}
            >
              <Trans>Invite People</Trans>
            </CategoryButton>
          </Show>
          <Show when={canOpenSettings()}>
            <CategoryButton
              icon={<Settings {...iconSize(22)} />}
              action="chevron"
              onClick={() => {
                props.onClose();
                openModal({
                  type: "settings",
                  config: "server",
                  context: props.server,
                });
              }}
            >
              <Trans>Settings</Trans>
            </CategoryButton>
          </Show>
          <CategoryButton
            icon={<Smile {...iconSize(22)} />}
            action="chevron"
            onClick={() => {
              props.onClose();
              openModal({
                type: "server_identity",
                member: props.server.member!,
              });
            }}
          >
            <Trans>Edit Identity</Trans>
          </CategoryButton>
          <CategoryButton
            icon={<Flag {...iconSize(22)} />}
            action="chevron"
            onClick={() => {
              props.onClose();
              openModal({
                type: "report_content",
                client: client(),
                target: props.server,
              });
            }}
          >
            <Trans>Report</Trans>
          </CategoryButton>
        </CategoryButtonGroup>
      </Column>
    </Dialog>
  );
}
