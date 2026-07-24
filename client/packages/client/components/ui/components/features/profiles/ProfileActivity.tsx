import { Show } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useActivityLabel } from "@revolt/common";

import { Text, typography } from "../../design";

import { ProfileCard } from "./ProfileCard";

/**
 * Profile card showing the user's current rich activity
 * (game, stream, music, etc.) — Discord-style "Playing X" block.
 */
export function ProfileActivity(props: { user: User }) {
  const { t } = useLingui();

  const activity = () => props.user.activity;

  const activityLabel = useActivityLabel();
  const heading = () => activityLabel(activity()?.kind, t`Activity`);

  return (
    <Show when={activity()}>
      {(a) => (
        <ProfileCard>
          <Text class="title" size="large">
            {heading()}
          </Text>
          <ActivityName>{a().name}</ActivityName>
          <Show when={a().details}>
            <Detail>{a().details}</Detail>
          </Show>
          <Show when={a().state}>
            <Detail>{a().state}</Detail>
          </Show>
          <Show when={a().url}>
            <ExternalLink href={a().url!} target="_blank" rel="noreferrer">
              <Trans>Open link</Trans>
            </ExternalLink>
          </Show>
        </ProfileCard>
      )}
    </Show>
  );
}

const ActivityName = styled("span", {
  base: {
    ...typography.raw({ class: "headline", size: "small" }),
    userSelect: "text",
  },
});

const Detail = styled("span", {
  base: {
    ...typography.raw({ class: "body", size: "small" }),
    color: "var(--md-sys-color-on-surface-variant)",
    userSelect: "text",
  },
});

const ExternalLink = styled("a", {
  base: {
    ...typography.raw({ class: "label", size: "medium" }),
    color: "var(--md-sys-color-primary)",
    textDecoration: "underline",
    cursor: "pointer",
  },
});
