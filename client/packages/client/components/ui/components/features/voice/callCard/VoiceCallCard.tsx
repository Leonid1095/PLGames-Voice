import { JSX } from "solid-js";

/**
 * Voice call card context — now a passthrough (floating/PiP removed)
 */
export function VoiceCallCardContext(props: { children: JSX.Element }) {
  return <>{props.children}</>;
}

/**
 * @deprecated No longer used — inline rendering replaces this
 */
export function VoiceChannelCallCardMount(_props: { channel: unknown }) {
  return null;
}
