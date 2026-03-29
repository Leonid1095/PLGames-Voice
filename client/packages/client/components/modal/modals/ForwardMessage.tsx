import { For, Show, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { Column, Dialog, DialogProps, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { useModals } from "..";

/**
 * Modal to forward a message to another channel
 */
export function ForwardMessageModal(
  props: DialogProps & { type: "forward_message"; message: any },
) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();
  const [search, setSearch] = createSignal("");
  const [sending, setSending] = createSignal(false);

  const channels = createMemo(() => {
    const c = client();
    if (!c) return [];
    const q = search().toLowerCase();
    return [...c.channels.values()]
      .filter(
        (ch) =>
          ch.type !== "VoiceChannel" &&
          ch.type !== "SavedMessages" &&
          ch.havePermission("SendMessage") &&
          ch.name &&
          (q === "" || ch.name.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  });

  async function forwardTo(channelId: string) {
    if (sending()) return;
    setSending(true);
    try {
      const channel = client()!.channels.get(channelId);
      if (!channel) return;

      const author = props.message.author?.username ?? "Unknown";
      const content = props.message.content
        ? `> **${author}:**\n> ${props.message.content.split("\n").join("\n> ")}\n\n*Forwarded message*`
        : `*Forwarded message from **${author}***`;

      await channel.sendMessage(content);
      props.onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Forward message</Trans>}
      actions={[{ text: <Trans>Cancel</Trans> }]}
    >
      <Column>
        <SearchInput
          type="text"
          placeholder={t`Search channels...`}
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
        <ChannelList>
          <For each={channels()}>
            {(channel) => (
              <ChannelItem onClick={() => forwardTo(channel.id)}>
                <Symbol size={18}>
                  {channel.type === "DirectMessage"
                    ? "person"
                    : channel.type === "Group"
                      ? "group"
                      : "tag"}
                </Symbol>
                <ChannelInfo>
                  <Text class="label">{channel.name}</Text>
                  <Show when={channel.server}>
                    <Text class="body" size="small">
                      {channel.server?.name}
                    </Text>
                  </Show>
                </ChannelInfo>
              </ChannelItem>
            )}
          </For>
          <Show when={channels().length === 0}>
            <Text
              style={{
                "text-align": "center",
                padding: "16px",
                color: "var(--md-sys-color-on-surface-variant)",
              }}
            >
              <Trans>No channels found</Trans>
            </Text>
          </Show>
        </ChannelList>
      </Column>
    </Dialog>
  );
}

const SearchInput = styled("input", {
  base: {
    padding: "8px 12px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "14px",
    outline: "none",
    "&:focus": {
      borderColor: "var(--md-sys-color-primary)",
    },
  },
});

const ChannelList = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "300px",
    overflowY: "auto",
    gap: "2px",
  },
});

const ChannelItem = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "var(--borderRadius-md)",
    border: "none",
    background: "transparent",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
});

const ChannelInfo = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    minWidth: 0,
  },
});
