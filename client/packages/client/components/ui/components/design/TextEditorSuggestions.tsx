import { useFloating } from "solid-floating-ui";
import { Accessor, For, Match, Switch, createSignal } from "solid-js";

import { autoUpdate, flip, shift } from "@floating-ui/dom";
import { Channel, ServerMember, ServerRole } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { CustomEmoji, UnicodeEmoji } from "@revolt/markdown/emoji";
import { useState } from "@revolt/state";

import { Avatar } from "./Avatar";

export interface AutoCompleteView {
  element: HTMLDivElement;
  selected: number;
  result:
    | {
        type: "emoji";
        matches: MatchEmoji[];
      }
    | {
        type: "user";
        matches: MatchUser[];
      }
    | {
        type: "role";
        matches: ServerRole[];
      }
    | {
        type: "channel";
        matches: Channel[];
      };
}

export type MatchEmoji =
  | {
      type: "unicode";
      codepoint: string;
      name: string;
    }
  | {
      type: "custom";
      id: string;
      name: string;
    };

export type MatchUser = User | ServerMember;

import type { User } from "stoat.js";

/**
 * Component to render all of the auto complete suggestions
 *
 * (AC5.) include visual rendering for auto complete
 */
export function Suggestions(props: {
  state: Accessor<AutoCompleteView | undefined>;
  selectAutoCompleteItem: (idx: number) => void;
  confirmAutoCompleteItem: () => void;
}) {
  const element = () => props.state()!.element;
  const [floating, setFloating] = createSignal<HTMLDivElement>();
  const state = useState();

  const position = useFloating(element, floating, {
    placement: "top-start",
    middleware: [flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div
      class={base()}
      ref={setFloating}
      style={{
        position: position.strategy,
        top: `${position.y ?? 0}px`,
        left: `${position.x ?? 0}px`,
        "z-index": "999",
      }}
    >
      <Switch>
        <Match when={props.state()!.result.type === "emoji"}>
          <For each={props.state()!.result.matches as MatchEmoji[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Switch
                  fallback={
                    <>
                      <UnicodeEmoji
                        emoji={(match as { codepoint: string }).codepoint}
                        pack={state.settings.getValue(
                          "appearance:unicode_emoji",
                        )}
                      />{" "}
                      <Name>:{match.name}:</Name>
                    </>
                  }
                >
                  <Match when={match.type === "custom"}>
                    <CustomEmoji id={(match as { id: string }).id} />{" "}
                    <Name>:{match.name}:</Name>
                  </Match>
                </Switch>
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state()!.result.type === "user"}>
          <For each={props.state()!.result.matches as MatchUser[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Avatar src={match.animatedAvatarURL} size={24} />{" "}
                <Name>{match.displayName}</Name>
                {match instanceof ServerMember &&
                  match.displayName !== match.user?.username && (
                    <>
                      {" "}
                      @{match.user?.username}#{match.user?.discriminator}
                    </>
                  )}
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state()!.result.type === "role"}>
          <For each={props.state()!.result.matches as ServerRole[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Name>{match.name}</Name>
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state()!.result.type === "channel"}>
          <For each={props.state()!.result.matches as Channel[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Name>#{match.name}</Name>
              </Entry>
            )}
          </For>
        </Match>
      </Switch>
    </div>
  );
}

/**
 * Individual auto complete entry
 */
const Entry = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",

    cursor: "pointer",
    gap: "var(--gap-md)",
    background: "transparent",
    padding: "var(--gap-sm) var(--gap-md)",
  },
  variants: {
    selected: {
      true: {
        background:
          "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
      },
    },
  },
});

/**
 * Entry name
 */
const Name = styled("div", {
  base: {
    fontSize: "0.9em",
  },
});

/**
 * Auto complete container
 */
const base = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-md) 0",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-xs)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
    boxShadow: "0 0 3px var(--md-sys-color-shadow)",
  },
});
