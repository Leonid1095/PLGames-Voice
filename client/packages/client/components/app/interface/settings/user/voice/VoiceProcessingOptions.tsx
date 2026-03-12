import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Voice processing options
 */
export function VoiceProcessingOptions() {
  const { t } = useLingui();
  const state = useState();

  return (
    <Column>
      <Text class="title">
        <Trans>Voice Processing</Trans>
      </Text>
      <Text class="body" size="small">
        {t`These settings affect your microphone input. Changes apply on next voice connection.`}
      </Text>
      <CategoryButton.Group>
        <CategoryButton
          icon={<Symbol size={20}>graphic_eq</Symbol>}
          action={
            <Checkbox
              checked={state.voice.krispNoiseCancellation}
              onChange={() =>
                (state.voice.krispNoiseCancellation =
                  !state.voice.krispNoiseCancellation)
              }
            />
          }
          onClick={() =>
            (state.voice.krispNoiseCancellation =
              !state.voice.krispNoiseCancellation)
          }
          description={
            t`AI-powered noise cancellation that removes background sounds better than standard suppression`
          }
        >
          {t`Krisp Noise Cancellation`}
        </CategoryButton>
        <CategoryButton
          icon={<Symbol size={20}>noise_aware</Symbol>}
          action={
            <Checkbox
              checked={state.voice.noiseSupression}
              onChange={() =>
                (state.voice.noiseSupression = !state.voice.noiseSupression)
              }
            />
          }
          onClick={() =>
            (state.voice.noiseSupression = !state.voice.noiseSupression)
          }
          description={
            t`Reduces background noise like fans, keyboards and ambient sounds`
          }
        >
          {t`Noise Suppression`}
        </CategoryButton>
        <CategoryButton
          icon={<Symbol size={20}>spatial_audio_off</Symbol>}
          action={
            <Checkbox
              checked={state.voice.echoCancellation}
              onChange={() =>
                (state.voice.echoCancellation = !state.voice.echoCancellation)
              }
            />
          }
          onClick={() =>
            (state.voice.echoCancellation = !state.voice.echoCancellation)
          }
          description={
            t`Prevents your speakers from feeding back into your microphone`
          }
        >
          {t`Echo Cancellation`}
        </CategoryButton>
        <CategoryButton
          icon={<Symbol size={20}>tune</Symbol>}
          action={
            <Checkbox
              checked={state.voice.autoGainControl}
              onChange={() =>
                (state.voice.autoGainControl = !state.voice.autoGainControl)
              }
            />
          }
          onClick={() =>
            (state.voice.autoGainControl = !state.voice.autoGainControl)
          }
          description={
            t`Automatically adjusts microphone volume so you're always heard clearly`
          }
        >
          {t`Automatic Gain Control`}
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
