import { Show, createSignal, onCleanup } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { IconButton } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

interface Props {
  onRecorded: (file: File) => void;
}

/**
 * Voice message recorder — hold or click to record, release/click to stop
 */
export function VoiceRecorder(props: Props) {
  const { t } = useLingui();
  const [recording, setRecording] = createSignal(false);
  const [duration, setDuration] = createSignal(0);

  let mediaRecorder: MediaRecorder | undefined;
  let chunks: Blob[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;
  let stream: MediaStream | undefined;

  onCleanup(() => {
    stopRecording();
  });

  async function startRecording() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "ogg";
        const file = new File(
          [blob],
          `voice-${Date.now()}.${ext}`,
          { type: mimeType },
        );
        props.onRecorded(file);
        cleanup();
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timer = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      // Microphone permission denied
    }
  }

  function stopRecording() {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.stop();
    }
    cleanup();
  }

  function cancelRecording() {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    cleanup();
  }

  function cleanup() {
    setRecording(false);
    setDuration(0);
    if (timer) clearInterval(timer);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = undefined;
    }
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <Show
      when={recording()}
      fallback={
        <IconButton
          onPress={startRecording}
          use:floating={{
            tooltip: {
              placement: "top",
              content: t`Record voice message`,
            },
          }}
        >
          <Symbol>mic</Symbol>
        </IconButton>
      }
    >
      <RecordingBar>
        <RecordingDot />
        <DurationText>{formatDuration(duration())}</DurationText>
        <IconButton
          size="xs"
          variant="tonal"
          onPress={cancelRecording}
          use:floating={{
            tooltip: { placement: "top", content: t`Cancel` },
          }}
        >
          <Symbol size={18}>close</Symbol>
        </IconButton>
        <SendRecordingButton
          size="xs"
          variant="filled"
          onPress={stopRecording}
          use:floating={{
            tooltip: { placement: "top", content: t`Send voice message` },
          }}
        >
          <Symbol size={18}>send</Symbol>
        </SendRecordingButton>
      </RecordingBar>
    </Show>
  );
}

const RecordingBar = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 8px",
    borderRadius: "var(--borderRadius-md)",
    background: "color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)",
  },
});

const RecordingDot = styled("div", {
  base: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--md-sys-color-error)",
    animation: "pulse 1s ease-in-out infinite",
    flexShrink: 0,
  },
});

const DurationText = styled("span", {
  base: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--md-sys-color-error)",
    fontVariantNumeric: "tabular-nums",
    minWidth: "36px",
  },
});

const SendRecordingButton = styled(IconButton, {
  base: {
    background: "var(--md-sys-color-primary) !important",
    color: "var(--md-sys-color-on-primary) !important",
  },
});
