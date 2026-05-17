import { Show } from "solid-js";
import { RefreshCw, Trash2, X } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";
import { UnsentMessage } from "@revolt/state/stores/Draft";

import { ContextMenu, ContextMenuButton } from "./ContextMenu";

interface Props {
  draft: UnsentMessage;
  channel: Channel;
}

/**
 * Context menu for draft messages
 */
export function DraftMessageContextMenu(props: Props) {
  const state = useState();
  const client = useClient();

  /**
   * Retry sending the draft message
   */
  function retrySend() {
    state.draft.retrySend(client(), props.channel, props.draft.idempotencyKey);
  }

  /**
   * Delete the draft message
   */
  function deleteMessage() {
    state.draft.cancelSend(props.channel, props.draft.idempotencyKey);
  }

  return (
    <Show when={props.draft.status !== "sending"}>
      <ContextMenu>
        <Show when={false}>
          <ContextMenuButton icon={X} onClick={deleteMessage} destructive>
            <Trans>Cancel message</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.draft.status === "failed" || props.draft.status === "unsent"
          }
        >
          <ContextMenuButton icon={RefreshCw} onClick={retrySend}>
            <Trans>Retry sending</Trans>
          </ContextMenuButton>
          <ContextMenuButton
            icon={Trash2}
            onClick={deleteMessage}
            destructive
          >
            <Trans>Delete message</Trans>
          </ContextMenuButton>
        </Show>
      </ContextMenu>
    </Show>
  );
}
