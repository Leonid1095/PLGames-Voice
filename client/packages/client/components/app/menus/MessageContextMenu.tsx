import { For, Match, Show, Switch } from "solid-js";
import { ArrowRight, ArrowUpRight, Badge, Bookmark, Copy, Download, Flag, Link, MessageSquareDot, Pencil, Reply, Share2, Shield, Trash2 } from "lucide-solid";

import { Trans } from "@lingui-solid/solid/macro";
import { File, Message } from "stoat.js";

import { useClient, useUser } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { CustomEmoji, UnicodeEmoji } from "@revolt/markdown/emoji";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";

import MdSentimentContent from "@material-symbols/svg-400/outlined/sentiment_content.svg?component-solid";

import { showToast } from "@revolt/ui/components/design";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
  ContextMenuSubMenu,
} from "./ContextMenu";

/**
 * Context menu for messages
 */
export function MessageContextMenu(props: { message?: Message; file?: File }) {
  const user = useUser();
  const state = useState();
  const client = useClient();
  const { openModal, showError } = useModals();

  /**
   * Reply to this message
   */
  function reply() {
    state.draft.addReply(props.message!, user()!.id);
  }

  /**
   * Translate message content
   */
  async function translateMessage() {
    const content = props.message?.content;
    if (!content) return;
    try {
      const targetLang = navigator.language.startsWith("ru") ? "en" : "ru";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(content.slice(0, 500))}&langpair=autodetect|${targetLang}`,
      );
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated) {
        openModal({
          type: "error2",
          title: targetLang === "ru" ? "Перевод" : "Translation",
          description: translated,
        } as any);
      }
    } catch {}
  }

  /**
   * Save message to local Saved Messages (localStorage)
   */
  function saveMessage() {
    try {
      const msg = props.message!;
      const saved = JSON.parse(localStorage.getItem("plg_saved_messages") || "[]");

      // Don't save duplicates
      if (saved.some((s: any) => s.id === msg.id)) return;

      saved.unshift({
        id: msg.id,
        channelId: msg.channelId,
        serverId: msg.server?.id || null,
        author: msg.author?.username || "?",
        authorId: msg.authorId,
        content: msg.content || "",
        timestamp: Date.now(),
      });

      // Keep last 200
      if (saved.length > 200) saved.length = 200;
      localStorage.setItem("plg_saved_messages", JSON.stringify(saved));
      showToast("success", "Сообщение сохранено", 2000);
    } catch {}
  }

  /**
   * Forward this message to another channel
   */
  function forward() {
    openModal({
      type: "forward_message",
      message: props.message!,
    } as any);
  }

  /**
   * Mark message as unread
   */
  function markAsUnread() {
    props.message!.ack(true, false, true);
  }

  /**
   * Copy message contents to clipboard
   */
  function copyText() {
    navigator.clipboard.writeText(props.message!.content);
    showToast("success", "Текст скопирован", 2000);
  }

  /**
   * Report the message
   */
  function report() {
    openModal({
      type: "report_content",
      target: props.message!,
      client: client(),
    });
  }

  /**
   * Delete the message
   */
  function deleteMessage(ev: MouseEvent) {
    if (ev.shiftKey) {
      props.message!.delete();
    } else {
      openModal({
        type: "delete_message",
        message: props.message!,
      });
    }
  }

  /**
   * Open message in PLG Voice Admin Panel
   */
  function openAdminPanel() {
    window.open(
      `${CONFIGURATION.DEFAULT_ADMIN_URL}/panel/inspect/message/${props.message!.id}`,
      "_blank",
    );
  }

  /**
   * Copy message link to clipboard
   */
  function copyLink() {
    navigator.clipboard.writeText(
      `${location.origin}${
        props.message!.server ? `/server/${props.message!.server?.id}` : ""
      }/channel/${props.message!.channelId}/${props.message!.id}`,
    );
    showToast("success", "Ссылка скопирована", 2000);
  }

  /**
   * Copy message id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.message!.id);
    showToast("info", "ID скопирован", 2000);
  }

  /**
   * Opens the file preview in a new tab
   */
  function OpenFile() {
    window.open(props.file?.originalUrl, "_blank");
  }

  /**
   * Copies the link to the original url of the file
   */
  function CopyLink() {
    navigator.clipboard.writeText(props.file?.originalUrl ?? "");
  }

  return (
    <ContextMenu>
      <Show when={props.file}>
        <ContextMenuButton icon={ArrowUpRight} onClick={OpenFile}>
          <Trans>Open file</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={Link} onClick={CopyLink}>
          <Trans>Copy link</Trans>
        </ContextMenuButton>
        <a
          target="_blank"
          download={props.file?.filename}
          href={props.file?.originalUrl}
        >
          <ContextMenuButton icon={Download}>
            <Trans>Save file</Trans>
          </ContextMenuButton>
        </a>

        <ContextMenuDivider />
      </Show>
      <Show when={props.message}>
        <Show when={props.message!.channel?.havePermission("SendMessage")}>
          <ContextMenuButton icon={Reply} onClick={reply}>
            <Trans>Reply</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.message!.channel?.havePermission("SendMessage")}>
          <ContextMenuButton icon={ArrowRight} onClick={forward}>
            <Trans>Forward</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuButton icon={Bookmark} onClick={saveMessage}>
          <Trans>Save</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={MdTranslate} onClick={translateMessage}>
          <Trans>Translate</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={MessageSquareDot} onClick={markAsUnread}>
          <Trans>Mark as unread</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={Copy} onClick={copyText}>
          <Trans>Copy text</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
        <Show
          when={
            props.message!.author?.self &&
            props.message!.channel?.havePermission("SendMessage")
          }
        >
          <ContextMenuButton
            icon={Pencil}
            onClick={() => state.draft.setEditingMessage(props.message!)}
          >
            <Trans>Edit message</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.message!.channel?.type === "DirectMessage" ||
            props.message!.channel?.havePermission("ManageMessages")
          }
        >
          <ContextMenuButton
            icon={MdPin}
            onClick={() => {
              if (props.message!.pinned) {
                props.message!.unpin().catch(showError);
              } else {
                props.message!.pin().catch(showError);
              }
            }}
          >
            <Switch fallback={<Trans>Pin message</Trans>}>
              <Match when={props.message!.pinned}>
                <Trans>Unpin message</Trans>
              </Match>
            </Switch>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.message!.reactions.size &&
            props.message!.channel?.havePermission("ManageMessages")
          }
        >
          <ContextMenuSubMenu
            icon={Trash2}
            onClick={() => props.message!.clearReactions()}
            destructive
            buttonContent={<Trans>Remove reaction</Trans>}
          >
            <For each={[...props.message!.reactions.keys()]}>
              {(key) => (
                <ContextMenuButton
                  onClick={() => props.message!.unreact(key, true)}
                >
                  <Switch fallback={<UnicodeEmoji emoji={key} />}>
                    <Match when={key.length === 26}>
                      <CustomEmoji id={key} />
                    </Match>
                  </Switch>
                </ContextMenuButton>
              )}
            </For>
          </ContextMenuSubMenu>
        </Show>
        <Show when={props.message!.reactions.size}>
          <ContextMenuButton
            symbol={MdSentimentContent}
            onClick={() => props.message!.clearReactions()}
            destructive
          >
            <Trans>Remove all reactions</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.message!.author?.self ||
            props.message!.channel?.havePermission("ManageMessages")
          }
        >
          <ContextMenuButton
            icon={Trash2}
            onClick={deleteMessage}
            destructive
          >
            <Trans>Delete message</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={!props.message!.author?.self}>
          <ContextMenuButton icon={Flag} onClick={report} destructive>
            <Trans>Report message</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuDivider />
        <Show when={state.settings.getValue("advanced:admin_panel")}>
          <ContextMenuButton icon={Shield} onClick={openAdminPanel}>
            <Trans>Admin Panel</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuButton icon={Share2} onClick={copyLink}>
          <Trans>Copy link</Trans>
        </ContextMenuButton>
        <Show when={state.settings.getValue("advanced:copy_id")}>
          <ContextMenuButton icon={Badge} onClick={copyId}>
            <Trans>Copy message ID</Trans>
          </ContextMenuButton>
        </Show>
      </Show>
    </ContextMenu>
  );
}
