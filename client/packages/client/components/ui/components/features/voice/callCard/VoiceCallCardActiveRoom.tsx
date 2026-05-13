import { Show, Switch, Match, For, createMemo, createSignal } from "solid-js";
import {
  TrackLoop,
  TrackReference,
  VideoTrack,
  isTrackReference,
  useEnsureParticipant,
  useIsMuted,
  useIsSpeaking,
  useMaybeTrackRefContext,
  useTrackRefContext,
  useTracks,
} from "solid-livekit-components";

import { Track } from "livekit-client";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useUser } from "@revolt/markdown/users";
import { InRoom } from "@revolt/rtc";
import { Avatar } from "@revolt/ui/components/design";
import { OverflowingText } from "@revolt/ui/components/utils";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { VoiceStatefulUserIcons } from "../VoiceStatefulUserIcons";

/**
 * Call card (active) — participant grid with speaker focus
 * Controls (status, mute, deafen, disconnect) are in VoiceBottomBar
 */
export function VoiceCallCardActiveRoom() {
  return (
    <View>
      <Call>
        <InRoom>
          <Participants />
        </InRoom>
      </Call>
    </View>
  );
}

const View = styled("div", {
  base: {
    minHeight: 0,
    height: "100%",
    width: "100%",

    gap: "var(--gap-md)",
    padding: "var(--gap-md)",

    display: "flex",
    flexDirection: "column",
  },
});

const Call = styled("div", {
  base: {
    flexGrow: 1,
    minHeight: 0,
    overflowY: "auto",
  },
});

/**
 * Show participants with smart layout:
 * - If screen share exists: main view (screen) + side strip (cameras)
 * - Otherwise: grid with speaker focus (speaking user gets larger tile)
 */
function Participants() {
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  const hasScreenShare = () => screenTracks.length > 0;

  return (
    <Show
      when={hasScreenShare()}
      fallback={
        <Grid>
          <TrackLoop tracks={cameraTracks}>
            {() => <UserTile />}
          </TrackLoop>
        </Grid>
      }
    >
      <ScreenShareLayout>
        <MainView>
          <TrackLoop tracks={screenTracks}>
            {() => <ScreenshareTile />}
          </TrackLoop>
        </MainView>
        <SideStrip>
          <TrackLoop tracks={cameraTracks}>
            {() => <UserTile compact />}
          </TrackLoop>
        </SideStrip>
      </ScreenShareLayout>
    </Show>
  );
}

/**
 * Screen share layout: main view + side camera strip
 */
const ScreenShareLayout = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    gap: "var(--gap-md)",
    height: "100%",
    minHeight: 0,
  },
});

const MainView = styled("div", {
  base: {
    flexGrow: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
  },
});

const SideStrip = styled("div", {
  base: {
    width: "200px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    overflowY: "auto",
  },
});

const Grid = styled("div", {
  base: {
    display: "grid",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  },
});

/**
 * Individual participant tile (camera or placeholder)
 */
function UserTile(props: { compact?: boolean }) {
  const participant = useEnsureParticipant();
  const track = useMaybeTrackRefContext();

  const isMuted = useIsMuted({
    participant,
    source: Track.Source.Microphone,
  });

  const isSpeaking = useIsSpeaking(participant);

  const user = useUser(participant.identity);

  return (
    <div
      class={tile({
        speaking: isSpeaking(),
        compact: props.compact,
      })}
      use:floating={{
        userCard: {
          user: user().user!,
          member: user().member,
        },
        contextMenu: () => (
          <UserContextMenu user={user().user!} member={user().member} inVoice />
        ),
      }}
    >
      <Switch
        fallback={
          <AvatarOnly>
            <Avatar
              src={user().avatar}
              fallback={user().username}
              size={props.compact ? 32 : 48}
              interactive={false}
            />
          </AvatarOnly>
        }
      >
        <Match when={isTrackReference(track)}>
          <VideoTrack
            style={{ "grid-area": "1/1" }}
            trackRef={track as TrackReference}
            manageSubscription={true}
          />
        </Match>
      </Switch>

      <Overlay>
        <OverlayInner>
          <OverflowingText>{user().username}</OverflowingText>
          <VoiceStatefulUserIcons
            userId={participant.identity}
            muted={isMuted()}
          />
        </OverlayInner>
        <Show when={isSpeaking()}>
          <SpeakingBar />
        </Show>
      </Overlay>
    </div>
  );
}

const AvatarOnly = styled("div", {
  base: {
    gridArea: "1/1",
    display: "grid",
    placeItems: "center",
  },
});

/**
 * Green speaking indicator bar at bottom of tile
 */
const SpeakingBar = styled("div", {
  base: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "var(--md-sys-color-primary)",
    borderRadius: "0 0 var(--borderRadius-lg) var(--borderRadius-lg)",
    animation: "pulse 1.5s ease-in-out infinite",
  },
});

/**
 * Shown when the track source is a screenshare
 */
function ScreenshareTile() {
  const participant = useEnsureParticipant();
  const track = useMaybeTrackRefContext();
  const user = useUser(participant.identity);

  const isMuted = useIsMuted({
    participant,
    source: Track.Source.ScreenShareAudio,
  });

  return (
    <div class={screenTile() + " group"}>
      <VideoTrack
        style={{ "grid-area": "1/1" }}
        trackRef={track as TrackReference}
        manageSubscription={true}
      />

      <Overlay showOnHover>
        <OverlayInner>
          <Symbol size={16} fill>screen_share</Symbol>
          <OverflowingText>{user().username}</OverflowingText>
          <Show when={isMuted()}>
            <Symbol size={18}>no_sound</Symbol>
          </Show>
        </OverlayInner>
      </Overlay>
    </div>
  );
}

const tile = cva({
  base: {
    display: "grid",
    aspectRatio: "16/10",
    transition: "outline-color 220ms cubic-bezier(0.05, 0.7, 0.1, 1), box-shadow 220ms cubic-bezier(0.05, 0.7, 0.1, 1), border-color 220ms cubic-bezier(0.05, 0.7, 0.1, 1)",
    borderRadius: "10px",
    position: "relative",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-low)",
    border: "1px solid var(--qp-border-subtle, rgba(255,255,255,0.06))",

    overflow: "hidden",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineOffset: "-1px",
    outlineColor: "transparent",
  },
  variants: {
    speaking: {
      true: {
        outlineColor: "var(--md-sys-color-primary)",
        boxShadow: "0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent), 0 0 24px color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent)",
      },
    },
    compact: {
      true: {
        aspectRatio: "4/3",
        borderRadius: "8px",
      },
    },
  },
});

/**
 * Screen share tile — takes up most of the space
 */
const screenTile = cva({
  base: {
    display: "grid",
    aspectRatio: "16/9",
    transition: ".3s ease all",
    borderRadius: "var(--borderRadius-lg)",
    position: "relative",
    flexGrow: 1,

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-highest)",

    overflow: "hidden",
    border: "2px solid var(--md-sys-color-outline-variant)",
  },
});

const Overlay = styled("div", {
  base: {
    minWidth: 0,
    gridArea: "1/1",
    position: "relative",

    padding: "var(--gap-md) var(--gap-lg)",

    opacity: 1,
    display: "flex",
    alignItems: "end",
    flexDirection: "column",
    justifyContent: "end",

    transition: "var(--transitions-fast) all",
    transitionTimingFunction: "ease",

    background: "linear-gradient(transparent 50%, rgba(0,0,0,0.5) 100%)",
  },
  variants: {
    showOnHover: {
      true: {
        opacity: 0,
        background: "transparent",

        _groupHover: {
          opacity: 1,
          background: "linear-gradient(transparent 50%, rgba(0,0,0,0.5) 100%)",
        },
      },
      false: {
        opacity: 1,
      },
    },
  },
  defaultVariants: {
    showOnHover: false,
  },
});

const OverlayInner = styled("div", {
  base: {
    minWidth: 0,
    width: "100%",

    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: "var(--gap-sm)",

    color: "white",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",

    _first: {
      flexGrow: 1,
    },
  },
});
