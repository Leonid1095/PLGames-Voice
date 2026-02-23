import { Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { Button, IconButton } from "@revolt/ui/components/design";
import { OverflowingText } from "@revolt/ui/components/utils";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { VoiceCallCardStatus } from "./callCard/VoiceCallCardStatus";

/**
 * Discord-style voice bottom bar for sidebar
 * Shows channel name, connection status, and mute/deafen/disconnect controls
 */
export function VoiceBottomBar() {
  const voice = useVoice();

  return (
    <Show when={voice.channel()}>
      <Bar>
        <Info>
          <ChannelName>
            <Symbol size={18}>volume_up</Symbol>
            <OverflowingText>{voice.channel()!.name}</OverflowingText>
          </ChannelName>
          <VoiceCallCardStatus />
        </Info>
        <Controls>
          <IconButton
            size="xs"
            variant={voice.microphone() ? "filled" : "tonal"}
            onPress={() => voice.toggleMute()}
            isDisabled={!voice.speakingPermission}
          >
            <Show
              when={voice.microphone()}
              fallback={<Symbol>mic_off</Symbol>}
            >
              <Symbol>mic</Symbol>
            </Show>
          </IconButton>
          <IconButton
            size="xs"
            variant={
              voice.deafen() || !voice.listenPermission ? "tonal" : "filled"
            }
            onPress={() => voice.toggleDeafen()}
            isDisabled={!voice.listenPermission}
          >
            <Show
              when={voice.deafen() || !voice.listenPermission}
              fallback={<Symbol>headset</Symbol>}
            >
              <Symbol>headset_off</Symbol>
            </Show>
          </IconButton>
          <Button
            size="xs"
            variant="_error"
            onPress={() => voice.disconnect()}
          >
            <Symbol>call_end</Symbol>
          </Button>
        </Controls>
      </Bar>
    </Show>
  );
}

const Bar = styled("div", {
  base: {
    flexShrink: 0,
    padding: "var(--gap-md)",
    gap: "var(--gap-sm)",

    display: "flex",
    flexDirection: "column",

    borderRadius: "var(--borderRadius-lg) var(--borderRadius-lg) 0 0",
    background: "var(--md-sys-color-surface-container)",
  },
});

const Info = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",

    fontSize: "var(--fontSize-sm)",
  },
});

const ChannelName = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",

    fontWeight: 600,
    color: "var(--md-sys-color-primary)",
    minWidth: 0,
  },
});

const Controls = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--gap-md)",
  },
});
