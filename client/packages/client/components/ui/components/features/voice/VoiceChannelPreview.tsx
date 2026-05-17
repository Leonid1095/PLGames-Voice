import { For, Show, createSignal, onCleanup, splitProps } from "solid-js";
import {
  TrackLoop,
  useEnsureParticipant,
  useIsMuted,
  useIsSpeaking,
  useTracks,
} from "solid-livekit-components";

import { ConnectionQuality, Track } from "livekit-client";
import { Channel, VoiceParticipant } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useUser } from "@revolt/markdown/users";
import { InRoom } from "@revolt/rtc";

import { Avatar, Ripple, typography } from "../../design";
import { Row } from "../../layout";

import { VoiceStatefulUserIcons } from "./VoiceStatefulUserIcons";

/**
 * Render a preview of users (or the active participants) for a given channel
 *
 * Designed for the server sidebar to be below channels
 */
export function VoiceChannelPreview(props: { channel: Channel }) {
  return (
    <InRoom
      channelId={props.channel.id}
      fallback={<VariantPreview channel={props.channel} />}
    >
      <VariantLive />
    </InRoom>
  );
}

/**
 * Use API as the source of truth
 */
function VariantLive() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  return (
    <Base>
      <TrackLoop tracks={tracks}>{() => <ParticipantLive />}</TrackLoop>
    </Base>
  );
}

/**
 * Use LiveKit as the source of truth
 */
function VariantPreview(props: { channel: Channel }) {
  return (
    <Show when={props.channel.voiceParticipants.size}>
      <Base>
        <For each={[...props.channel.voiceParticipants.values()]}>
          {(participant) => <ParticipantPreview participant={participant} />}
        </For>
      </Base>
    </Show>
  );
}

/**
 * Live variant of participant
 */
function ParticipantLive() {
  const participant = useEnsureParticipant();

  const isMuted = useIsMuted({
    participant,
    source: Track.Source.Microphone,
  });

  const isSpeaking = useIsSpeaking(participant);

  const [quality, setQuality] = createSignal<ConnectionQuality>(
    participant.connectionQuality,
  );

  const onQualityChanged = (q: ConnectionQuality) => setQuality(q);
  participant.on("connectionQualityChanged" as any, onQualityChanged);
  onCleanup(() =>
    participant.off("connectionQualityChanged" as any, onQualityChanged),
  );

  return (
    <CommonUser
      userId={participant.identity}
      speaking={isSpeaking()}
      muted={isMuted()}
      deafened={false}
      camera={false}
      screenshare={false}
      connectionQuality={quality()}
      isLive
    />
  );
}

/**
 * Preview variant of participant
 */
function ParticipantPreview(props: { participant: VoiceParticipant }) {
  return (
    <CommonUser
      userId={props.participant.userId}
      speaking={false}
      muted={!props.participant.isPublishing()}
      deafened={!props.participant.isReceiving()}
      camera={props.participant.isCamera()}
      screenshare={props.participant.isScreensharing()}
    />
  );
}

/**
 * Component used for both variants
 */
/**
 * Connection quality indicator bars
 */
function QualityIndicator(props: { quality?: ConnectionQuality }) {
  const bars = () => {
    switch (props.quality) {
      case ConnectionQuality.Excellent:
        return 4;
      case ConnectionQuality.Good:
        return 3;
      case ConnectionQuality.Poor:
        return 2;
      case ConnectionQuality.Lost:
        return 1;
      default:
        return 0;
    }
  };

  const color = () => {
    const b = bars();
    if (b >= 3) return "var(--md-sys-color-primary)";
    if (b === 2) return "#f59e0b";
    if (b === 1) return "var(--md-sys-color-error)";
    return "var(--md-sys-color-outline)";
  };

  return (
    <Show when={bars() > 0}>
      <svg width="14" height="12" viewBox="0 0 14 12" style={{ "flex-shrink": "0" }}>
        <rect x="0" y="9" width="2.5" height="3" rx="0.5" fill={bars() >= 1 ? color() : "var(--md-sys-color-outline-variant)"} />
        <rect x="3.8" y="6" width="2.5" height="6" rx="0.5" fill={bars() >= 2 ? color() : "var(--md-sys-color-outline-variant)"} />
        <rect x="7.6" y="3" width="2.5" height="9" rx="0.5" fill={bars() >= 3 ? color() : "var(--md-sys-color-outline-variant)"} />
        <rect x="11.4" y="0" width="2.5" height="12" rx="0.5" fill={bars() >= 4 ? color() : "var(--md-sys-color-outline-variant)"} />
      </svg>
    </Show>
  );
}

function CommonUser(props: {
  userId: string;
  speaking: boolean;
  muted: boolean;
  deafened: boolean;
  camera: boolean;
  screenshare: boolean;
  connectionQuality?: ConnectionQuality;
  isLive?: boolean;
}) {
  const [iconProps, rest] = splitProps(props, [
    "muted",
    "deafened",
    "camera",
    "screenshare",
  ]);

  const user = useUser(() => rest.userId);

  return (
    <div
      class={previewUser({ speaking: rest.speaking })}
      use:floating={{
        userCard: {
          user: user().user!,
          member: user().member,
        },
        contextMenu: () => (
          <UserContextMenu
            user={user().user!}
            member={user().member}
            inVoice={rest.isLive}
          />
        ),
      }}
    >
      <Ripple />
      <Avatar size={24} src={user().avatar} fallback={user().username} />{" "}
      <PreviewUsername>{user().username}</PreviewUsername>
      <GameBadge
        activity={user().user?.activity}
        statusText={user().user?.status?.text}
      />
      <Row gap="sm">
        <VoiceStatefulUserIcons {...iconProps} userId={rest.userId} />
        <QualityIndicator quality={rest.connectionQuality} />
      </Row>
    </div>
  );
}

/**
 * Show game/activity badge. Prefers structured `user.activity`,
 * falls back to legacy "🎮 ..." prefix in status text.
 */
function GameBadge(props: {
  activity?: { kind?: string; name?: string } | null;
  statusText?: string | null;
}) {
  const display = () => {
    const a = props.activity;
    if (a && a.name) {
      const icon =
        a.kind === "Streaming"
          ? "🔴"
          : a.kind === "Listening"
            ? "🎵"
            : a.kind === "Watching"
              ? "📺"
              : a.kind === "Competing"
                ? "🏆"
                : "🎮";
      return { icon, name: a.name };
    }
    const text = props.statusText;
    if (text && text.startsWith("🎮 ")) {
      return { icon: "🎮", name: text.slice(3) };
    }
    return null;
  };

  return (
    <Show when={display()}>
      {(d) => (
        <GameBadgeLabel>
          <GamepadIcon>{d().icon}</GamepadIcon>
          {d().name}
        </GameBadgeLabel>
      )}
    </Show>
  );
}

const GameBadgeLabel = styled("span", {
  base: {
    ...typography.raw({ class: "label", size: "small" }),
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "10px",
    padding: "1px 4px",
    borderRadius: "var(--borderRadius-sm)",
    backgroundColor: "var(--md-sys-color-tertiary-container)",
    color: "var(--md-sys-color-on-tertiary-container)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100px",
  },
});

const GamepadIcon = styled("span", {
  base: {
    fontSize: "11px",
    lineHeight: 1,
    flexShrink: 0,
  },
});

const Base = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",

    marginBlock: "var(--gap-sm)",
    marginInlineStart: "var(--gap-xl)",
    marginInlineEnd: "var(--gap-md)",

    color: "var(--md-sys-color-outline)",

    borderRadius: "var(--borderRadius-md)",
  },
});

const previewUser = cva({
  base: {
    padding: "var(--gap-sm)",
    position: "relative", // ... <Ripple />
    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    borderRadius: "var(--borderRadius-md)",
  },
  variants: {
    speaking: {
      true: {
        color: "var(--md-sys-color-on-surface)",

        "& svg": {
          outlineOffset: "1px",
          outline: "2px solid var(--md-sys-color-primary)",
          borderRadius: "var(--borderRadius-circle)",
        },
      },
    },
  },
});

const PreviewUsername = styled("span", {
  base: {
    ...typography.raw(),

    flexGrow: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});
