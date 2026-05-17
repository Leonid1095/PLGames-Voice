import { Show } from "solid-js";
import { Cake, Pencil } from "lucide-solid";

import { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useTime } from "@revolt/i18n";
import { Avatar, CategoryButton, IconButton, iconSize } from "@revolt/ui";

export function UserSummary(props: {
  user: User;
  showBadges?: boolean;
  bannerUrl?: string;
  onEdit?: () => void;
}) {
  const dayjs = useTime();
  const bannerStyle = () =>
    props.bannerUrl
      ? {
          "background-image": `linear-gradient(color-mix(in srgb, var(--md-sys-color-surface-container-low) 70%, transparent), color-mix(in srgb, var(--md-sys-color-surface-container-low) 70%, transparent)), url("${props.bannerUrl}")`,
          color: "var(--md-sys-color-on-surface)",
        }
      : {
          /* Neutral surface — matches Quiet Pro mockup. The previous
             primary-container fill made the banner read as "selected"
             and the text underneath was hard to see on light mode. */
          background: `var(--md-sys-color-surface-container)`,
          color: "var(--md-sys-color-on-surface)",
        };

  return (
    <CategoryButton.Group>
      <AccountBox style={bannerStyle()}>
        <ProfileDetails>
          <Avatar src={props.user.animatedAvatarURL} size={58} />
          <Username>
            <span>{props.user.displayName}</span>
            <span>
              {props.user.username}#{props.user.discriminator}
            </span>
          </Username>
          <Show when={props.onEdit}>
            <IconButton variant="filled" shape="square" onPress={props.onEdit}>
              <Pencil />
            </IconButton>
          </Show>
        </ProfileDetails>
        <Show when={props.showBadges}>
          <BottomBar>
            <DummyPadding />
            {/* <ProfileBadges>
              <MdDraw {...iconSize(20)} />
              <MdDraw {...iconSize(20)} />
              <MdDraw {...iconSize(20)} />
            </ProfileBadges> */}
            <ProfileBadges>
              <span
                use:floating={{
                  tooltip: {
                    placement: "top",
                    // todo
                    content: dayjs(props.user.createdAt).format(
                      "[Account created] Do MMMM YYYY [at] HH:mm",
                    ),
                  },
                }}
              >
                <Cake {...iconSize(14)} />
              </span>
            </ProfileBadges>
          </BottomBar>
        </Show>
      </AccountBox>
    </CategoryButton.Group>
  );
}

const AccountBox = styled("div", {
  base: {
    display: "flex",
    padding: "var(--gap-lg)",
    flexDirection: "column",

    backgroundSize: "cover",
    backgroundPosition: "center",
  },
});

const ProfileDetails = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-lg)",
    alignItems: "center",
  },
});

const Username = styled("div", {
  base: {
    flexGrow: 1,

    display: "flex",
    flexDirection: "column",

    /* Inherit from AccountBox bannerStyle so colour follows the chosen
       banner (image vs neutral surface). Don't pin to a M3 token here
       — the parent already sets the right on-surface colour. */
    color: "inherit",

    // Display Name
    "& :nth-child(1)": {
      fontSize: "18px",
      fontWeight: 600,
      letterSpacing: "-0.015em",
    },

    // Username#Discrim
    "& :nth-child(2)": {
      fontSize: "14px",
      fontWeight: 400,
      opacity: 0.7,
    },
  },
});

const BottomBar = styled("div", {
  base: {
    display: "flex",
  },
});

const DummyPadding = styled("div", {
  base: {
    flexShrink: 0,
    // Matches with avatar size
    width: "58px",
    // Matches with ProfileDetails
    marginInlineEnd: "var(--gap-lg)",
  },
});

const ProfileBadges = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-sm)",
    width: "fit-content",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",

    fill: "var(--md-sys-color-on-secondary)",
    background: "var(--md-sys-color-secondary)",
  },
});
