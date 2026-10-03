import { createResource, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
import { CreditCard, Home, MessageSquareDot, PlusCircle, Radio, Settings, Users } from "lucide-solid";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { PublicChannelInvite } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { IS_DEV, useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import {
  BrandMark,
  Button,
  CategoryButton,
  Column,
  Header,
  iconSize,
  main,
} from "@revolt/ui";

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
    width: "300px",
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
const SignupPathRow = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "8px 16px",
    maxWidth: "560px",
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    letterSpacing: "var(--pd-tracking-label)",
    textTransform: "uppercase",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const SignupPathLabel = styled("span", {
  base: {
    color: "var(--md-sys-color-on-surface)",
  },
});

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
    // The shared mono label, replacing this screen's own 600/0.08em variant.
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    fontWeight: "var(--pd-weight-regular)",
    textTransform: "uppercase",
    letterSpacing: "var(--pd-tracking-label)",
    color: "var(--md-sys-color-on-surface-variant)",
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
    borderRadius: "var(--pd-radius-md)",
    overflow: "hidden",
    background: "var(--pd-surface-raised)",
    boxShadow: "var(--pd-shadow-raised)",
    border: "1px solid var(--pd-border-subtle)",
    cursor: "pointer",
    transition: "transform var(--pd-transition-base), border-color var(--pd-transition-base)",
    textDecoration: "none",
    color: "inherit",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "var(--pd-shadow-float)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "&:hover": { transform: "none" },
    },
  },
});

const StreamPreview = styled("div", {
  base: {
    position: "relative",
    aspectRatio: "16/9",
    background: "var(--pd-ink)",
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
    background: "var(--pd-live)",
    color: "var(--pd-ink)",
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    padding: "3px 7px",
    borderRadius: "var(--pd-radius-xs)",
    textTransform: "uppercase",
    letterSpacing: "var(--pd-tracking-label)",
  },
});

const ViewersBadge = styled("span", {
  base: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    fontVariantNumeric: "tabular-nums",
    padding: "3px 7px",
    borderRadius: "var(--pd-radius-xs)",
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

async function fetchActiveStreams(
  auth: [string, string] | undefined,
): Promise<StreamData[]> {
  if (!auth) return [];
  try {
    const [key, value] = auth;
    const res = await fetch("/stream/active", { headers: { [key]: value } });
    if (!res.ok) return [];
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
  const client = useClient();
  // /stream/active requires a session the API recognises, so pass ours along.
  const [streams, { refetch }] = createResource(() =>
    fetchActiveStreams(client()?.authenticationHeader),
  );

  // Auto-refresh every 30s
  setInterval(() => refetch(), 30000);

  return (
    <Show when={streams() && streams()!.length > 0}>
      <StreamsSection>
        <StreamsTitle>
          <Radio {...iconSize(18)} />
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
                  <Radio
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
type SignupPath = {
  visit: number;
  account: number;
  username: number;
  server: number;
};

export function HomePage() {
  const { t } = useLingui();
  const { openModal } = useModals();
  const navigate = useNavigate();
  const client = useClient();

  onMount(() => {
    if (sessionStorage.getItem("plg-pending-server") !== "1") return;
    sessionStorage.removeItem("plg-pending-server");
    const current = client();
    if (!current) return;
    openModal({ type: "create_server", client: current });
  });

  const ownsServer = () => {
    const current = client();
    const me = current?.user?.id;
    if (!current || !me) return false;
    for (const server of current.servers.values()) {
      if (server.ownerId === me) return true;
    }
    return false;
  };

  const [signupPath] = createResource(ownsServer, async (owns) => {
    if (!owns) return null;
    try {
      return (await client()!.api.get("/funnel")) as SignupPath;
    } catch {
      return null;
    }
  });

  const showLoungeButton = CONFIGURATION.IS_PLGAMES;
  const signupLabels = {
    path: t`Signup path`,
    visits: t`Visits`,
    accounts: t`Accounts`,
    usernames: t`Usernames`,
    servers: t`First servers`,
  };
  const COMMUNITY_SERVER_ID = "01KJ3E82WMT4EEAJ4NMJ7H7V3Z";
  const isInLounge =
    client()!.servers.get(COMMUNITY_SERVER_ID) !== undefined;

  return (
    <Base>
      <Header placement="primary">
        <HeaderIcon>
          <Home {...iconSize(22)} />
        </HeaderIcon>
        <Trans>Home</Trans>
      </Header>
      <div use:scrollable={{ class: content() }}>
        <Column>
          <BrandMark themed size={40} />
        </Column>
        <Show when={signupPath()}>
          {(path) => (
            <SignupPathRow>
              <SignupPathLabel>{signupLabels.path}</SignupPathLabel>
              <span>
                {signupLabels.visits} {path().visit}
              </span>
              <span>
                {signupLabels.accounts} {path().account}
              </span>
              <span>
                {signupLabels.usernames} {path().username}
              </span>
              <span>
                {signupLabels.servers} {path().server}
              </span>
            </SignupPathRow>
          )}
        </Show>
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
              icon={<PlusCircle />}
            >
              <Trans>Create a group or server</Trans>
            </CategoryButton>
            <Switch fallback={null}>
              <Match when={showLoungeButton && isInLounge}>
                <CategoryButton
                  onClick={() => navigate(`/server/${COMMUNITY_SERVER_ID}`)}
                  description={
                    <Trans>
                      You can report issues and discuss improvements with us
                      directly here.
                    </Trans>
                  }
                  icon={<Users />}
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
                  icon={<Users />}
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
              icon={<CreditCard />}
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
              icon={<MessageSquareDot {...iconSize(22)} />}
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
              icon={<Settings />}
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
