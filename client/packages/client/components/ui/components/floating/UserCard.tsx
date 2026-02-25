import { JSX } from "solid-js";

import { useQuery } from "@tanstack/solid-query";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";

import { Profile } from "../features";

/**
 * Base element for the card
 */
const base = cva({
  base: {
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
    boxShadow: "var(--elevation-3)",
    border:
      "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 15%, transparent)",

    width: "320px",
    maxHeight: "min(80vh, 560px)",

    borderRadius: "var(--borderRadius-xl)",
  },
});

/**
 * User Card
 */
export function UserCard(
  props: JSX.Directives["floating"]["userCard"] &
    object & { onClose: () => void },
) {
  const { openModal } = useModals();
  const query = useQuery(() => ({
    queryKey: ["profile", props.user.id],
    queryFn: () => props.user.fetchProfile(),
  }));

  function openFull() {
    openModal({ type: "user_profile", user: props.user });
    props.onClose();
  }

  return (
    <div
      use:invisibleScrollable={{ class: base() }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      }}
    >
      <Layout>
        <Profile.Banner
          width={2}
          user={props.user}
          member={props.member}
          bannerUrl={query.data?.animatedBannerURL}
          onClick={openFull}
        />

        <Profile.Actions user={props.user} member={props.member} width={2} />

        <Sections>
          <Profile.Roles member={props.member} />
          <Profile.Badges user={props.user} />
          <Profile.Status user={props.user} />
          <Profile.Joined user={props.user} member={props.member} />
        </Sections>

        <Profile.Bio content={query.data?.content} onClick={openFull} />
      </Layout>
    </div>
  );
}

const Layout = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
  },
});

const Sections = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
  },
});
