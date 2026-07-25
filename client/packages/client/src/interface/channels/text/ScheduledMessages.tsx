import { Show, createSignal, onCleanup, onMount } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { IconButton } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

interface ScheduledMessage {
  channelId: string;
  content: string;
  sendAt: number;
}

function getScheduledMessages(): ScheduledMessage[] {
  try {
    return JSON.parse(localStorage.getItem("scheduled_messages") || "[]");
  } catch {
    return [];
  }
}

/**
 * Background worker that sends scheduled messages when their time arrives.
 * Polls every 15 seconds.
 */
export function ScheduledMessagesWorker() {
  const client = useClient();

  onMount(() => {
    const interval = setInterval(async () => {
      const scheduled = getScheduledMessages();
      const now = Date.now();
      const remaining: ScheduledMessage[] = [];

      for (const msg of scheduled) {
        if (msg.sendAt <= now) {
          try {
            const ch = client()?.channels.get(msg.channelId);
            if (ch) await ch.sendMessage(msg.content);
          } catch { /* skip */ }
        } else {
          remaining.push(msg);
        }
      }

      if (remaining.length !== scheduled.length) {
        localStorage.setItem("scheduled_messages", JSON.stringify(remaining));
      }
    }, 15000);

    onCleanup(() => clearInterval(interval));
  });

  return null;
}

interface ScheduleDropdownProps {
  channelId: string;
  canSend: boolean;
  getContent: () => string | undefined;
  onScheduled: () => void;
}

/**
 * Schedule message button + dropdown
 */
export function ScheduleMessageButton(props: ScheduleDropdownProps) {
  const { t } = useLingui();
  const [showScheduler, setShowScheduler] = createSignal(false);
  const [scheduleTime, setScheduleTime] = createSignal("");

  function scheduleMessage() {
    const content = props.getContent()?.trim();
    if (!content || !scheduleTime()) return;

    const sendAt = new Date(scheduleTime()).getTime();
    if (sendAt <= Date.now()) return;

    const scheduled = getScheduledMessages();
    scheduled.push({ channelId: props.channelId, content, sendAt });
    localStorage.setItem("scheduled_messages", JSON.stringify(scheduled));

    setShowScheduler(false);
    setScheduleTime("");
    props.onScheduled();
  }

  return (
    <div style={{ position: "relative" }}>
      <IconButton
        size="sm"
        variant="tonal"
        shape="square"
        isDisabled={!props.canSend}
        onPress={() => setShowScheduler((v) => !v)}
        use:floating={{
          tooltip: { placement: "top", content: t`Schedule message` },
        }}
      >
        <Symbol size={18}>schedule_send</Symbol>
      </IconButton>
      <Show when={showScheduler()}>
        <Dropdown>
          <DropdownLabel>{t`Schedule message`}</DropdownLabel>
          <DateInput
            type="datetime-local"
            value={scheduleTime()}
            onInput={(e) => setScheduleTime(e.currentTarget.value)}
            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
          />
          <DropdownActions>
            <CancelBtn onClick={() => setShowScheduler(false)}>
              {t`Cancel`}
            </CancelBtn>
            <SubmitBtn
              onClick={scheduleMessage}
              disabled={!scheduleTime()}
            >
              {t`Schedule`}
            </SubmitBtn>
          </DropdownActions>
        </Dropdown>
      </Show>
    </div>
  );
}

const Dropdown = styled("div", {
  base: {
    position: "absolute",
    bottom: "40px",
    right: "0",
    background: "var(--md-sys-color-surface-container-high)",
    borderRadius: "12px",
    padding: "12px",
    boxShadow: "var(--pd-shadow-float)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "220px",
  },
});

const DropdownLabel = styled("span", {
  base: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const DateInput = styled("input", {
  base: {
    background: "var(--md-sys-color-surface-container)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    borderRadius: "8px",
    padding: "8px",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
  },
});

const DropdownActions = styled("div", {
  base: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
  },
});

const CancelBtn = styled("button", {
  base: {
    background: "transparent",
    border: "none",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
  },
});

const SubmitBtn = styled("button", {
  base: {
    background: "var(--md-sys-color-primary)",
    border: "none",
    color: "var(--md-sys-color-on-primary)",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    "&:disabled": {
      opacity: 0.5,
    },
  },
});
