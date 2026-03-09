import { Trans } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";

/**
 * Voice processing options
 */
export function VoiceProcessingOptions() {
  const state = useState();

  return (
    <Column>
      <Text class="title">
        <Trans>Voice Processing</Trans>
      </Text>
      <Text class="body" size="small">
        <Trans>
          These settings affect your microphone input. Changes apply on next
          voice connection.
        </Trans>
      </Text>
      <CategoryButton.Group>
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={state.voice.noiseSupression} />}
          onClick={() =>
            (state.voice.noiseSupression = !state.voice.noiseSupression)
          }
          description={
            <Trans>
              Reduces background noise like fans, keyboards and ambient sounds
            </Trans>
          }
        >
          <Trans>Noise Suppression</Trans>
        </CategoryButton>
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={state.voice.echoCancellation} />}
          onClick={() =>
            (state.voice.echoCancellation = !state.voice.echoCancellation)
          }
          description={
            <Trans>
              Prevents your speakers from feeding back into your microphone
            </Trans>
          }
        >
          <Trans>Echo Cancellation</Trans>
        </CategoryButton>
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={state.voice.autoGainControl} />}
          onClick={() =>
            (state.voice.autoGainControl = !state.voice.autoGainControl)
          }
          description={
            <Trans>
              Automatically adjusts microphone volume so you're always heard
              clearly
            </Trans>
          }
        >
          <Trans>Automatic Gain Control</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
