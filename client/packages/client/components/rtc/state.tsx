import {
  Accessor,
  JSX,
  Setter,
  batch,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import { RoomContext } from "solid-livekit-components";

import { Room, LocalAudioTrack, type TrackProcessor } from "livekit-client";
import { Channel } from "stoat.js";

import { useState } from "@revolt/state";
import { Voice as VoiceSettings } from "@revolt/state/stores/Voice";

import { InRoom } from "./components/InRoom";
import { RoomAudioManager } from "./components/RoomAudioManager";

type State =
  | "READY"
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING";

class Voice {
  #settings: VoiceSettings;

  channel: Accessor<Channel | undefined>;
  #setChannel: Setter<Channel | undefined>;

  room: Accessor<Room | undefined>;
  #setRoom: Setter<Room | undefined>;

  state: Accessor<State>;
  #setState: Setter<State>;

  deafen: Accessor<boolean>;
  #setDeafen: Setter<boolean>;

  microphone: Accessor<boolean>;
  #setMicrophone: Setter<boolean>;

  video: Accessor<boolean>;
  #setVideo: Setter<boolean>;

  screenshare: Accessor<boolean>;
  #setScreenshare: Setter<boolean>;

  constructor(voiceSettings: VoiceSettings) {
    this.#settings = voiceSettings;

    const [channel, setChannel] = createSignal<Channel>();
    this.channel = channel;
    this.#setChannel = setChannel;

    const [room, setRoom] = createSignal<Room>();
    this.room = room;
    this.#setRoom = setRoom;

    const [state, setState] = createSignal<State>("READY");
    this.state = state;
    this.#setState = setState;

    const [deafen, setDeafen] = createSignal<boolean>(false);
    this.deafen = deafen;
    this.#setDeafen = setDeafen;

    const [microphone, setMicrophone] = createSignal(false);
    this.microphone = microphone;
    this.#setMicrophone = setMicrophone;

    const [video, setVideo] = createSignal(false);
    this.video = video;
    this.#setVideo = setVideo;

    const [screenshare, setScreenshare] = createSignal(false);
    this.screenshare = screenshare;
    this.#setScreenshare = setScreenshare;
  }

  async connect(channel: Channel, auth?: { url: string; token: string }) {
    // Clean up previous room without going through READY state
    // (prevents reactive effects from seeing intermediate disconnected state)
    const oldRoom = this.room();
    if (oldRoom) {
      oldRoom.removeAllListeners();
      oldRoom.disconnect();
    }

    const room = new Room({
      audioCaptureDefaults: {
        deviceId: this.#settings.preferredAudioInputDevice,
        echoCancellation: this.#settings.echoCancellation,
        noiseSuppression: this.#settings.noiseSupression,
        autoGainControl: this.#settings.autoGainControl,
      },
      audioOutput: {
        deviceId: this.#settings.preferredAudioOutputDevice,
      },
    });

    // Atomically transition from old channel to new channel
    // State goes CONNECTED(A) → CONNECTING(B), never through READY
    batch(() => {
      this.#setRoom(room);
      this.#setChannel(channel);
      this.#setState("CONNECTING");

      this.#setMicrophone(false);
      this.#setDeafen(false);
      this.#setVideo(false);
      this.#setScreenshare(false);
    });

    room.addListener("connected", () => this.#setState("CONNECTED"));
    room.addListener("reconnecting", () => this.#setState("RECONNECTING"));
    room.addListener("disconnected", () => this.#setState("DISCONNECTED"));

    if (!auth) {
      auth = await channel.joinCall("worldwide");
    }

    await room.connect(auth.url, auth.token, {
      autoSubscribe: false,
    });

    // Enable microphone after connection to avoid blocking on browser permission dialog
    if (this.speakingPermission) {
      room.localParticipant
        .setMicrophoneEnabled(true)
        .then(async (pub) => {
          this.#setMicrophone(typeof pub !== "undefined");
          if (pub?.track && this.#settings.krispNoiseCancellation) {
            await this.#applyKrisp(pub.track as LocalAudioTrack);
          }
        });
    }
  }

  disconnect() {
    const room = this.room();
    if (!room) return;

    room.removeAllListeners();
    room.disconnect();

    batch(() => {
      this.#setState("READY");
      this.#setRoom(undefined);
      this.#setChannel(undefined);
    });
  }

  async toggleDeafen() {
    this.#setDeafen((s) => !s);
  }

  async toggleMute() {
    const room = this.room();
    if (!room) throw new Error("Voice: no active room");
    await room.localParticipant.setMicrophoneEnabled(
      !room.localParticipant.isMicrophoneEnabled,
    );

    this.#setMicrophone(room.localParticipant.isMicrophoneEnabled);
  }

  async toggleCamera() {
    const room = this.room();
    if (!room) throw new Error("Voice: no active room");
    await room.localParticipant.setCameraEnabled(
      !room.localParticipant.isCameraEnabled,
    );

    this.#setVideo(room.localParticipant.isCameraEnabled);
  }

  async toggleScreenshare() {
    const room = this.room();
    if (!room) throw new Error("Voice: no active room");
    await room.localParticipant.setScreenShareEnabled(
      !room.localParticipant.isScreenShareEnabled,
    );

    this.#setScreenshare(room.localParticipant.isScreenShareEnabled);
  }

  async #applyKrisp(track: LocalAudioTrack) {
    try {
      const { KrispNoiseFilter } = await import(
        "@livekit/krisp-noise-filter"
      );
      const krisp = KrispNoiseFilter();
      await track.setProcessor(krisp as TrackProcessor<typeof track.kind>);
    } catch (e) {
      console.warn("Krisp noise filter failed to load:", e);
    }
  }

  getConnectedUser(userId: string) {
    return this.room()?.getParticipantByIdentity(userId);
  }

  get listenPermission() {
    return !!this.channel()?.havePermission("Listen");
  }

  get speakingPermission() {
    return !!this.channel()?.havePermission("Speak");
  }
}

const voiceContext = createContext<Voice>(null as unknown as Voice);

/**
 * Mount global voice context and room audio manager
 */
export function VoiceContext(props: { children: JSX.Element }) {
  const state = useState();
  const voice = new Voice(state.voice);

  return (
    <voiceContext.Provider value={voice}>
      <RoomContext.Provider value={voice.room}>
        {props.children}
        <InRoom>
          <RoomAudioManager />
        </InRoom>
      </RoomContext.Provider>
    </voiceContext.Provider>
  );
}

export const useVoice = () => useContext(voiceContext);
