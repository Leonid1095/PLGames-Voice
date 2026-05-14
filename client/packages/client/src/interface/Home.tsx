import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { PublicChannelInvite } from "stoat.js";
import { css, cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { IS_DEV, useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import {
  Button,
  CategoryButton,
  Column,
  Header,
  iconSize,
  main,
} from "@revolt/ui";

import MdAddCircle from "@material-design-icons/svg/filled/add_circle.svg?component-solid";
import MdGroups3 from "@material-design-icons/svg/filled/groups_3.svg?component-solid";
import MdHome from "@material-design-icons/svg/filled/home.svg?component-solid";
import MdLive from "@material-design-icons/svg/filled/live_tv.svg?component-solid";
import MdPayments from "@material-design-icons/svg/filled/payments.svg?component-solid";
import MdRateReview from "@material-design-icons/svg/filled/rate_review.svg?component-solid";
import MdSettings from "@material-design-icons/svg/filled/settings.svg?component-solid";

import Wordmark from "../../public/assets/web/wordmark.svg?component-solid";

import { HeaderIcon } from "./common/CommonHeader";

/**
 * Base layout of the home page (i.e. the header/background)
 */
const Base = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    flexDirection: "column",

    color: "var(--md-sys-color-on-surface)",
  },
});

/**
 * Layout of the content as a whole
 */
const content = cva({
  base: {
    ...main.raw(),

    padding: "48px 0",

    gap: "32px",
    alignItems: "center",
    justifyContent: "center",

    animationName: "contentFadeIn",
    animationDuration: "0.4s",
    animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    animationFillMode: "both",
  },
});

/**
 * Layout of the buttons
 */
const Buttons = styled("div", {
  base: {
    gap: "12px",
    padding: 0,
    display: "flex",

    color: "var(--md-sys-color-on-surface-variant)",
    background: "transparent",

    "@media (max-width: 768px)": {
      flexDirection: "column",
      width: "100%",
      maxWidth: "320px",
    },
  },
});

/**
 * Make sure the columns are separated
 */
const SeparatedColumn = styled(Column, {
  base: {
    justifyContent: "stretch",
    marginInline: "0.25em",
    width: "260px",
    "& > *": {
      flexGrow: 1,
    },

    "@media (max-width: 768px)": {
      width: "100%",
      marginInline: 0,
    },
  },
});

/**
 * Stream card styles
 */
const StreamsSection = styled("div", {
  base: {
    width: "100%",
    maxWidth: "560px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

const StreamsTitle = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
  },
});

const StreamsGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px",
  },
});

const StreamCard = styled("a", {
  base: {
    display: "flex",
    flexDirection: "column",
    borderRadius: "10px",
    overflow: "hidden",
    background: "var(--md-sys-color-surface-container-low)",
    border: "1px solid var(--qp-border-subtle, rgba(255,255,255,0.06))",
    cursor: "pointer",
    transition: "transform 180ms cubic-bezier(0.2,0,0,1), border-color 180ms cubic-bezier(0.2,0,0,1)",
    textDecoration: "none",
    color: "inherit",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    },
  },
});

const StreamPreview = styled("div", {
  base: {
    position: "relative",
    aspectRatio: "16/9",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

const LiveBadge = styled("span", {
  base: {
    position: "absolute",
    top: "8px",
    left: "8px",
    background: "#e94560",
    color: "white",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "4px",
    letterSpacing: "0.05em",
  },
});

const ViewersBadge = styled("span", {
  base: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "4px",
  },
});

const StreamInfo = styled("div", {
  base: {
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
});

const StreamName = styled("div", {
  base: {
    fontSize: "14px",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const StreamStreamer = styled("div", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

interface StreamData {
  name: string;
  room: string;
  streamer: string;
  viewers: number;
  startedAt: number;
  viewUrl: string;
}

async function fetchActiveStreams(): Promise<StreamData[]> {
  try {
    const res = await fetch("/stream/active");
    const data = await res.json();
    return data.streams || [];
  } catch {
    return [];
  }
}

function formatDuration(startedAt: number): string {
  const sec = Math.floor((Date.now() - startedAt) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

/**
 * Active streams component for home page
 */
function ActiveStreams() {
  const [streams, { refetch }] = createResource(fetchActiveStreams);

  // Auto-refresh every 30s
  setInterval(() => refetch(), 30000);

  return (
    <Show when={streams() && streams()!.length > 0}>
      <StreamsSection>
        <StreamsTitle>
          <MdLive {...iconSize(18)} />
          <Trans>Live Streams</Trans>
        </StreamsTitle>
        <StreamsGrid>
          <For each={streams()}>
            {(stream) => (
              <StreamCard
                href={stream.viewUrl}
                target="_blank"
                rel="noopener"
              >
                <StreamPreview>
                  <LiveBadge>
                    <Trans>LIVE</Trans>
                  </LiveBadge>
                  <ViewersBadge>
                    {stream.viewers}{" "}
                    {stream.viewers === 1
                      ? t`viewer`
                      : t`viewers`}
                  </ViewersBadge>
                  <MdLive
                    {...iconSize(48)}
                    style={{ opacity: 0.2 }}
                  />
                </StreamPreview>
                <StreamInfo>
                  <StreamName>{stream.name}</StreamName>
                  <StreamStreamer>
                    {stream.streamer} · {formatDuration(stream.startedAt)}
                  </StreamStreamer>
                </StreamInfo>
              </StreamCard>
            )}
          </For>
        </StreamsGrid>
      </StreamsSection>
    </Show>
  );
}

/**
 * Home page
 */
export function HomePage() {
  const { t } = useLingui();
  const { openModal } = useModals();
  const navigate = useNavigate();
  const client = useClient();

  // check if we're stoat.chat; if so, check if the user is in the Lounge
  const showLoungeButton = CONFIGURATION.IS_PLGAMES;
  const isInLounge =
    client()!.servers.get("01F7ZSBSFHQ8TA81725KQCSDDP") !== undefined;

  return (
    <Base>
      <Header placement="primary">
        <HeaderIcon>
          <MdHome {...iconSize(22)} />
        </HeaderIcon>
        <Trans>Home</Trans>
      </Header>
      <div use:scrollable={{ class: content() }}>
        <Column>
          <Wordmark
            class={css({
              width: "220px",
              height: "auto",
              fill: "var(--md-sys-color-on-surface)",
            })}
          />
        </Column>
        <ActiveStreams />
        <Buttons>
          <SeparatedColumn>
            <CategoryButton
              onClick={() =>
                openModal({
                  type: "create_group_or_server",
                  client: client()!,
                })
              }
              description={
                <Trans>
                  Invite all of your friends, some cool bots, and throw a big
                  party.
                </Trans>
              }
              icon={<MdAddCircle />}
            >
              <Trans>Create a group or server</Trans>
            </CategoryButton>
            <Switch fallback={null}>
              <Match when={showLoungeButton && isInLounge}>
                <CategoryButton
                  onClick={() => navigate("/server/01F7ZSBSFHQ8TA81725KQCSDDP")}
                  description={
                    <Trans>
                      You can report issues and discuss improvements with us
                      directly here.
                    </Trans>
                  }
                  icon={<MdGroups3 />}
                >
                  <Trans>Go to the PLG Voice community</Trans>
                </CategoryButton>
              </Match>
              <Match when={showLoungeButton && !isInLounge}>
                <CategoryButton
                  onClick={() => {
                    client()
                      .api.get("/invites/Testers")
                      .then((invite) =>
                        PublicChannelInvite.from(client(), invite),
                      )
                      .then((invite) => openModal({ type: "invite", invite }));
                  }}
                  description={
                    <Trans>
                      You can report issues and discuss improvements with us
                      directly here.
                    </Trans>
                  }
                  icon={<MdGroups3 />}
                >
                  <Trans>Join the PLG Voice community</Trans>
                </CategoryButton>
              </Match>
            </Switch>
            <CategoryButton
              variant="tertiary"
              onClick={() =>
                window.open(
                  "https://new.donatepay.ru/@lenya",
                )
              }
              description={
                <Trans>Support the project by donating - thank you!</Trans>
              }
              icon={<MdPayments />}
            >
              <Trans>Donate to PLG Voice</Trans>
            </CategoryButton>
          </SeparatedColumn>
          <SeparatedColumn>
            <CategoryButton
              onClick={() =>
                openModal({
                  type: "settings",
                  config: "user",
                  context: { page: "feedback" },
                })
              }
              description={
                <Trans>
                  Let us know how we can improve our app by giving us feedback.
                </Trans>
              }
              icon={<MdRateReview {...iconSize(22)} />}
            >
              <Trans>Give feedback on PLG Voice</Trans>
            </CategoryButton>
            <CategoryButton
              onClick={() => openModal({ type: "settings", config: "user" })}
              description={
                <Trans>
                  You can also click the gear icon in the bottom left.
                </Trans>
              }
              icon={<MdSettings />}
            >
              <Trans>Open settings</Trans>
            </CategoryButton>
          </SeparatedColumn>
        </Buttons>
        <Show when={IS_DEV}>
          <Button onPress={() => navigate("/dev")}>
            Open Development Page
          </Button>
        </Show>
      </div>
    </Base>
  );
}
