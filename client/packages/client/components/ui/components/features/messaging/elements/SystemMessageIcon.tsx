import { Match, Switch } from "solid-js";
import { AlignLeft, ArrowLeft, ArrowRight, Image, Info, KeyRound, Minus, Phone, Pin, Plus, ShieldX, Tag, X, XCircle } from "lucide-solid";

import { SystemMessage } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useTime } from "@revolt/i18n";
import { Tooltip } from "@revolt/ui/components/floating";
import { Time, formatTime } from "@revolt/ui/components/utils";

/**
 * System Message Icon
 */
export function SystemMessageIcon(props: {
  createdAt: Date;
  isServer: boolean;
  systemMessage: SystemMessage;
}) {
  const dayjs = useTime();

  return (
    <Base type={props.systemMessage.type}>
      <Tooltip
        content={() => <Time format="relative" value={props.createdAt} />}
        aria={
          formatTime(dayjs, {
            format: "relative",
            value: props.createdAt,
          }) as string
        }
        placement="top"
      >
        <Switch fallback={<Info size={16} />}>
          <Match when={props.systemMessage.type === "user_added"}>
            <Plus size={16} />
          </Match>
          <Match
            when={props.systemMessage.type === "user_left" && !props.isServer}
          >
            <Minus size={16} />
          </Match>
          <Match when={props.systemMessage.type === "user_remove"}>
            <X size={16} />
          </Match>
          <Match when={props.systemMessage.type === "user_kicked"}>
            <XCircle size={16} />
          </Match>
          <Match when={props.systemMessage.type === "user_banned"}>
            <ShieldX size={16} />
          </Match>
          <Match when={props.systemMessage.type === "user_joined"}>
            <ArrowRight size={16} />
          </Match>
          <Match
            when={props.systemMessage.type === "user_left" && props.isServer}
          >
            <ArrowLeft size={16} />
          </Match>
          <Match when={props.systemMessage.type === "channel_renamed"}>
            <Tag size={16} />
          </Match>
          <Match
            when={props.systemMessage.type === "channel_description_changed"}
          >
            <AlignLeft size={16} />
          </Match>
          <Match when={props.systemMessage.type === "channel_icon_changed"}>
            <Image size={16} />
          </Match>
          <Match
            when={props.systemMessage.type === "channel_ownership_changed"}
          >
            <KeyRound size={16} />
          </Match>
          <Match
            when={
              props.systemMessage.type === "message_pinned" ||
              props.systemMessage.type === "message_unpinned"
            }
          >
            <Pin size={16} />
          </Match>
          <Match when={props.systemMessage.type === "call_started"}>
            <Phone size={16} />
          </Match>
        </Switch>
      </Tooltip>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    width: "62px",
    display: "grid",
    placeItems: "center",
  },
  variants: {
    type: {
      user_added: {
        color: "var(--md-sys-color-primary)",
      },
      user_joined: {
        color: "var(--md-sys-color-primary)",
      },
      channel_ownership_changed: {
        color: "var(--md-sys-color-primary)",
      },
      user_left: {
        color: "var(--md-sys-color-error)",
      },
      user_kicked: {
        color: "var(--md-sys-color-error)",
      },
      user_banned: {
        color: "var(--md-sys-color-error)",
      },
      text: {
        color: "var(--md-sys-color-primary)",
      },
      user_remove: {
        color: "var(--md-sys-color-primary)",
      },
      channel_renamed: {
        color: "var(--md-sys-color-primary)",
      },
      channel_description_changed: {
        color: "var(--md-sys-color-primary)",
      },
      channel_icon_changed: {
        color: "var(--md-sys-color-primary)",
      },
      message_pinned: {
        color: "var(--md-sys-color-primary)",
      },
      message_unpinned: {
        color: "var(--md-sys-color-primary)",
      },
      call_started: {
        color: "var(--md-sys-color-primary)",
      },
    },
  },
});
