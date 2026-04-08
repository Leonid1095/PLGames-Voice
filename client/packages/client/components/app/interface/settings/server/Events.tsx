import { For, Show, createResource, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Button, Column, Row, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ServerSettingsProps } from "../ServerSettings";

interface ServerEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  channel_id?: string;
  max_participants?: number;
  rsvp_yes: string[];
  rsvp_maybe: string[];
  rsvp_no: string[];
  created_by: string;
}

/**
 * Server events / calendar
 */
export function Events(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  // Events stored in localStorage per server (until backend supports it)
  const storageKey = () => `plg_events_${props.server.id}`;

  function loadEvents(): ServerEvent[] {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) ?? "[]");
    } catch {
      return [];
    }
  }

  function saveEvents(events: ServerEvent[]) {
    localStorage.setItem(storageKey(), JSON.stringify(events));
    setEvents(events);
  }

  const [events, setEvents] = createSignal<ServerEvent[]>(loadEvents());
  const [showForm, setShowForm] = createSignal(false);

  // Form state
  const [title, setTitle] = createSignal("");
  const [desc, setDesc] = createSignal("");
  const [startTime, setStartTime] = createSignal("");
  const [channelId, setChannelId] = createSignal("");
  const [maxPart, setMaxPart] = createSignal(0);

  const channels = () =>
    props.server.orderedChannels
      .flatMap((cat) => cat.channels)
      .filter((ch) => !ch.isVoice);

  const userId = () => client()?.user?.id ?? "";

  function createEvent() {
    if (!title().trim() || !startTime()) return;

    const newEvent: ServerEvent = {
      id: Date.now().toString(36),
      title: title().trim(),
      description: desc().trim(),
      start_time: startTime(),
      channel_id: channelId() || undefined,
      max_participants: maxPart() > 0 ? maxPart() : undefined,
      rsvp_yes: [],
      rsvp_maybe: [],
      rsvp_no: [],
      created_by: userId(),
    };

    saveEvents([...events(), newEvent]);
    setTitle("");
    setDesc("");
    setStartTime("");
    setShowForm(false);

    // Post announcement to channel if selected
    if (channelId()) {
      const channel = client()!.channels.get(channelId());
      if (channel) {
        const timeStr = new Date(startTime()).toLocaleString("ru-RU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
        const eventLabel = t`Event`;
        const maxLabel = t`Max participants`;
        channel.sendMessage(
          `📅 **${eventLabel}: ${newEvent.title}**\n\n${newEvent.description ? newEvent.description + "\n\n" : ""}🕐 ${timeStr}${newEvent.max_participants ? `\n👥 ${maxLabel}: ${newEvent.max_participants}` : ""}`,
        );
      }
    }
  }

  function rsvp(eventId: string, status: "yes" | "maybe" | "no") {
    const updated = events().map((ev) => {
      if (ev.id !== eventId) return ev;
      const uid = userId();
      const newEv = { ...ev };
      newEv.rsvp_yes = newEv.rsvp_yes.filter((u) => u !== uid);
      newEv.rsvp_maybe = newEv.rsvp_maybe.filter((u) => u !== uid);
      newEv.rsvp_no = newEv.rsvp_no.filter((u) => u !== uid);
      if (status === "yes") newEv.rsvp_yes.push(uid);
      else if (status === "maybe") newEv.rsvp_maybe.push(uid);
      else newEv.rsvp_no.push(uid);
      return newEv;
    });
    saveEvents(updated);
  }

  function deleteEvent(eventId: string) {
    saveEvents(events().filter((ev) => ev.id !== eventId));
  }

  const upcomingEvents = () =>
    events()
      .filter((ev) => new Date(ev.start_time) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );

  const pastEvents = () =>
    events()
      .filter((ev) => new Date(ev.start_time) < new Date())
      .sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
      )
      .slice(0, 5);

  return (
    <Column gap="xl">
      <Row align style={{ "justify-content": "space-between" }}>
        <Text class="label" size="large">
          <Trans>Events</Trans>
        </Text>
        <Button onPress={() => setShowForm(!showForm())}>
          <Symbol size={18}>{showForm() ? "close" : "add"}</Symbol>
          <Show when={!showForm()}>
            <Trans>New Event</Trans>
          </Show>
        </Button>
      </Row>

      {/* Create form */}
      <Show when={showForm()}>
        <FormCard>
          <InputField
            type="text"
            placeholder={t`Event title`}
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
          />
          <textarea
            placeholder={t`Description (optional)`}
            value={desc()}
            onInput={(e) => setDesc(e.currentTarget.value)}
            rows={2}
            style={{
              padding: "8px 12px",
              "border-radius": "8px",
              border: "1px solid var(--md-sys-color-outline-variant)",
              background: "var(--md-sys-color-surface-container)",
              color: "var(--md-sys-color-on-surface)",
              "font-size": "13px",
              resize: "vertical",
            }}
          />
          <Row align gap="sm" style={{ "flex-wrap": "wrap" }}>
            <InputField
              type="datetime-local"
              value={startTime()}
              onInput={(e) => setStartTime(e.currentTarget.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <SelectField
              value={channelId()}
              onChange={(e) => setChannelId(e.currentTarget.value)}
            >
              <option value="">{t`No announcement`}</option>
              <For each={channels()}>
                {(ch) => <option value={ch.id}>#{ch.name}</option>}
              </For>
            </SelectField>
          </Row>
          <Button
            onPress={createEvent}
            isDisabled={!title().trim() || !startTime()}
          >
            <Trans>Create Event</Trans>
          </Button>
        </FormCard>
      </Show>

      {/* Upcoming */}
      <Show
        when={upcomingEvents().length > 0}
        fallback={
          <Text
            class="body"
            size="small"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            <Trans>No upcoming events</Trans>
          </Text>
        }
      >
        <Column gap="sm">
          <For each={upcomingEvents()}>
            {(ev) => (
              <EventCard>
                <Row
                  align
                  style={{ "justify-content": "space-between" }}
                >
                  <Column gap="none">
                    <Text
                      style={{ "font-weight": "600", "font-size": "14px" }}
                    >
                      {ev.title}
                    </Text>
                    <Text
                      class="body"
                      size="small"
                      style={{
                        color: "var(--md-sys-color-on-surface-variant)",
                      }}
                    >
                      📅{" "}
                      {new Date(ev.start_time).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Column>
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--md-sys-color-error)",
                    }}
                  >
                    <Symbol size={16}>delete</Symbol>
                  </button>
                </Row>
                <Show when={ev.description}>
                  <Text class="body" size="small">
                    {ev.description}
                  </Text>
                </Show>
                <RsvpRow>
                  <RsvpButton
                    active={ev.rsvp_yes.includes(userId())}
                    onClick={() => rsvp(ev.id, "yes")}
                  >
                    ✅ {ev.rsvp_yes.length}
                  </RsvpButton>
                  <RsvpButton
                    active={ev.rsvp_maybe.includes(userId())}
                    onClick={() => rsvp(ev.id, "maybe")}
                  >
                    🤔 {ev.rsvp_maybe.length}
                  </RsvpButton>
                  <RsvpButton
                    active={ev.rsvp_no.includes(userId())}
                    onClick={() => rsvp(ev.id, "no")}
                  >
                    ❌ {ev.rsvp_no.length}
                  </RsvpButton>
                </RsvpRow>
              </EventCard>
            )}
          </For>
        </Column>
      </Show>

      {/* Past */}
      <Show when={pastEvents().length > 0}>
        <Column>
          <Text
            class="label"
            style={{ color: "var(--md-sys-color-on-surface-variant)" }}
          >
            <Trans>Past events</Trans>
          </Text>
          <For each={pastEvents()}>
            {(ev) => (
              <PastEventRow>
                <span>{ev.title}</span>
                <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {new Date(ev.start_time).toLocaleDateString("ru-RU")}
                </span>
              </PastEventRow>
            )}
          </For>
        </Column>
      </Show>
    </Column>
  );
}

const FormCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    borderRadius: "12px",
    background: "var(--md-sys-color-surface-container)",
    border: "1px solid var(--md-sys-color-outline-variant)",
  },
});

const EventCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    borderRadius: "12px",
    background: "var(--md-sys-color-surface-container)",
  },
});

const RsvpRow = styled("div", {
  base: {
    display: "flex",
    gap: "6px",
  },
});

const RsvpButton = styled("button", {
  base: {
    padding: "4px 12px",
    borderRadius: "16px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
    transition: "all var(--transition-fast)",
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
      },
    },
  },
});

const InputField = styled("input", {
  base: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container-low)",
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
    background: "var(--md-sys-color-surface-container-low)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "13px",
  },
});

const PastEventRow = styled("div", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: "13px",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    opacity: 0.6,
  },
});
