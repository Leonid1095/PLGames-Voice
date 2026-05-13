import { Match, Show, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { IconButton } from "@revolt/ui/components/design";
import { OverflowingText } from "@revolt/ui/components/utils";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Compact Discord-style voice bottom bar for sidebar
 */
export function VoiceBottomBar() {
  const voice = useVoice();
  const { t } = useLingui();

  return (
    <Show when={voice.channel()}>
      <Bar data-voice-bar>
        <Info>
          <ChannelName>
            <Symbol size={16}>volume_up</Symbol>
            <OverflowingText>{voice.channel()!.name}</OverflowingText>
          </ChannelName>
          <StatusText>
            <Switch>
              <Match when={voice.state() === "CONNECTED"}>
                <StatusDot status="connected" />
                <StatusLabel status="connected">
                  <Trans>Connected</Trans>
                </StatusLabel>
              </Match>
              <Match when={voice.state() === "CONNECTING"}>
                <StatusDot status="connecting" />
                <StatusLabel status="connecting">
                  <Trans>Connecting...</Trans>
                </StatusLabel>
              </Match>
              <Match when={voice.state() === "RECONNECTING"}>
                <StatusDot status="unstable" />
                <StatusLabel status="unstable">
                  <Trans>Reconnecting...</Trans>
                </StatusLabel>
              </Match>
              <Match when={voice.state() === "DISCONNECTED"}>
                <StatusDot status="disconnected" />
                <StatusLabel status="disconnected">
                  <Trans>Disconnected</Trans>
                </StatusLabel>
              </Match>
            </Switch>
          </StatusText>
        </Info>
        <Controls>
          <IconButton
            size="xs"
            variant={voice.microphone() ? "filled" : "tonal"}
            onPress={() => voice.toggleMute()}
            isDisabled={!voice.speakingPermission}
            title={voice.microphone() ? t`Mute microphone` : t`Unmute microphone`}
          >
            <Show
              when={voice.microphone()}
              fallback={<Symbol size={18}>mic_off</Symbol>}
            >
              <Symbol size={18}>mic</Symbol>
            </Show>
          </IconButton>
          <IconButton
            size="xs"
            variant={
              voice.deafen() || !voice.listenPermission ? "tonal" : "filled"
            }
            onPress={() => voice.toggleDeafen()}
            isDisabled={!voice.listenPermission}
            title={voice.deafen() ? t`Undeafen` : t`Deafen`}
          >
            <Show
              when={voice.deafen() || !voice.listenPermission}
              fallback={<Symbol size={18}>headset</Symbol>}
            >
              <Symbol size={18}>headset_off</Symbol>
            </Show>
          </IconButton>
          <IconButton
            size="xs"
            variant={voice.video() ? "filled" : "tonal"}
            onPress={() => voice.toggleCamera()}
            title={voice.video() ? t`Turn off camera` : t`Turn on camera`}
          >
            <Show
              when={voice.video()}
              fallback={<Symbol size={18}>videocam_off</Symbol>}
            >
              <Symbol size={18}>videocam</Symbol>
            </Show>
          </IconButton>
          <IconButton
            size="xs"
            variant={voice.screenshare() ? "filled" : "tonal"}
            onPress={() => voice.toggleScreenshare()}
            title={voice.screenshare() ? t`Stop screen share` : t`Share screen`}
          >
            <Show
              when={voice.screenshare()}
              fallback={<Symbol size={18}>screen_share</Symbol>}
            >
              <Symbol size={18}>stop_screen_share</Symbol>
            </Show>
          </IconButton>
          <DisconnectButton
            size="xs"
            variant="tonal"
            onPress={() => voice.disconnect()}
            title={t`Disconnect`}
          >
            <Symbol size={18}>call_end</Symbol>
          </DisconnectButton>
        </Controls>
      </Bar>
    </Show>
  );
}

const Bar = styled("div", {
  base: {
    flexShrink: 0,
    padding: "8px 12px",

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",

    background: "var(--md-sys-color-surface-container-low)",
    borderTop: "1px solid var(--qp-border-subtle, rgba(255,255,255,0.06))",
  },
});

const Info = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    minWidth: 0,
    flexShrink: 1,
  },
});

const ChannelName = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",

    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "-0.005em",
    color: "var(--md-sys-color-on-surface)",
    minWidth: 0,
  },
});

const StatusText = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
  },
});

const StatusDot = styled("div", {
  base: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  variants: {
    status: {
      connected: {
        background: "var(--brand-presence-online)",
      },
      connecting: {
        background: "var(--brand-presence-busy)",
        animation: "pulse 1.5s ease-in-out infinite",
      },
      unstable: {
        background: "var(--brand-presence-idle)",
        animation: "pulse 1.5s ease-in-out infinite",
      },
      disconnected: {
        background: "var(--brand-presence-busy)",
      },
    },
  },
});

const StatusLabel = styled("span", {
  base: {
    fontSize: "11px",
    fontWeight: 500,
  },
  variants: {
    status: {
      connected: {
        color: "var(--brand-presence-online)",
      },
      connecting: {
        color: "var(--brand-presence-busy)",
      },
      unstable: {
        color: "var(--brand-presence-idle)",
      },
      disconnected: {
        color: "var(--brand-presence-busy)",
      },
    },
  },
});

const Controls = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap: "2px",
  },
});

const DisconnectButton = styled(IconButton, {
  base: {
    background: "color-mix(in srgb, var(--md-sys-color-error) 15%, transparent) !important",
    color: "var(--md-sys-color-error) !important",

    "&:hover": {
      background: "color-mix(in srgb, var(--md-sys-color-error) 30%, transparent) !important",
    },
  },
});
