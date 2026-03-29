import { For, Show, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Avatar, Button, Column, Text } from "@revolt/ui";

import MdExplore from "@material-design-icons/svg/filled/explore.svg?component-solid";
import MdGroup from "@material-design-icons/svg/filled/group.svg?component-solid";
import MdSearch from "@material-design-icons/svg/filled/search.svg?component-solid";

const RE_INVITE_URL = /(?:invite)\/([a-z0-9]+)/gi;

/**
 * Discover page — browse user's servers + join by invite
 */
export function Discover() {
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();

  const [query, setQuery] = createSignal("");
  const [inviteCode, setInviteCode] = createSignal("");
  const [joinError, setJoinError] = createSignal("");
  const [joining, setJoining] = createSignal(false);

  const servers = createMemo(() => {
    const all = [...client()!.servers.values()];
    const q = query().toLowerCase().trim();
    if (!q) return all;
    return all.filter((s) => s.name.toLowerCase().includes(q));
  });

  async function handleJoin() {
    const raw = inviteCode().trim();
    if (!raw) return;

    setJoinError("");
    setJoining(true);

    try {
      let code = raw;
      RE_INVITE_URL.lastIndex = 0;
      const match = RE_INVITE_URL.exec(code);
      if (match) code = match[1];

      const result = await client()!.api.post(`/invites/${code}`);
      if (result.type === "Server") {
        navigate(`/server/${result.server._id}`);
      }
      setInviteCode("");
    } catch (e: any) {
      setJoinError(e?.message || t`Failed to join`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <Base>
      <Container>
        <Header>
          <MdExplore width={32} height={32} />
          <h2>
            <Trans>Browse servers</Trans>
          </h2>
        </Header>

        <SearchBox>
          <MdSearch width={20} height={20} />
          <input
            type="text"
            placeholder={t`Search servers by name...`}
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
        </SearchBox>

        <SectionTitle>
          <Trans>Your servers</Trans>
        </SectionTitle>

        <Show
          when={servers().length > 0}
          fallback={
            <EmptyState>
              <Trans>No servers found</Trans>
            </EmptyState>
          }
        >
          <Grid>
            <For each={servers()}>
              {(server) => (
                <Card onClick={() => navigate(`/server/${server.id}`)}>
                  <CardContent>
                    <Avatar
                      size={48}
                      src={server.iconURL}
                      fallback={server.name}
                      interactive
                    />
                    <CardInfo>
                      <CardName>{server.name}</CardName>
                      <CardMeta>
                        <MdGroup width={14} height={14} />
                        <Trans>{server.memberCount ?? "?"} members</Trans>
                      </CardMeta>
                    </CardInfo>
                  </CardContent>
                </Card>
              )}
            </For>
          </Grid>
        </Show>

        <Divider />

        <SectionTitle>
          <Trans>Join by invite</Trans>
        </SectionTitle>

        <JoinRow>
          <JoinInput
            type="text"
            placeholder={t`Enter invite code or link`}
            value={inviteCode()}
            onInput={(e) => setInviteCode(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <Button onPress={handleJoin} isDisabled={joining() || !inviteCode().trim()}>
            <Trans>Join</Trans>
          </Button>
        </JoinRow>

        <Show when={joinError()}>
          <ErrorText>{joinError()}</ErrorText>
        </Show>
      </Container>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    width: "100%",
    flexGrow: 1,
    display: "flex",
    justifyContent: "center",
    overflowY: "auto",
    color: "var(--md-sys-color-on-surface)",
    padding: "24px",
  },
});

const Container = styled("div", {
  base: {
    width: "100%",
    maxWidth: "900px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
});

const Header = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fill: "var(--md-sys-color-primary)",
    "& h2": {
      margin: 0,
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "var(--md-sys-color-on-surface)",
    },
  },
});

const SearchBox = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    borderRadius: "12px",
    background: "color-mix(in srgb, var(--md-sys-color-surface-container-high) 80%, transparent)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    fill: "var(--md-sys-color-on-surface-variant)",
    "& input": {
      flex: 1,
      border: "none",
      background: "transparent",
      color: "var(--md-sys-color-on-surface)",
      fontSize: "0.95rem",
      outline: "none",
      "&::placeholder": {
        color: "var(--md-sys-color-on-surface-variant)",
      },
    },
  },
});

const SectionTitle = styled("h3", {
  base: {
    margin: 0,
    fontSize: "0.85rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const Grid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "12px",
  },
});

const Card = styled("div", {
  base: {
    padding: "16px",
    borderRadius: "16px",
    cursor: "pointer",
    background: "color-mix(in srgb, var(--md-sys-color-surface-container) 60%, transparent)",
    backdropFilter: "blur(12px)",
    border: "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent)",
    transition: "var(--transitions-medium) all",
    "&:hover": {
      background: "color-mix(in srgb, var(--md-sys-color-surface-container-high) 80%, transparent)",
      boxShadow: "0 4px 16px color-mix(in srgb, var(--md-sys-color-shadow) 15%, transparent)",
      transform: "translateY(-2px)",
    },
  },
});

const CardContent = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
});

const CardInfo = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
});

const CardName = styled("span", {
  base: {
    fontWeight: 600,
    fontSize: "1rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const CardMeta = styled("span", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.8rem",
    color: "var(--md-sys-color-on-surface-variant)",
    fill: "var(--md-sys-color-on-surface-variant)",
  },
});

const EmptyState = styled("div", {
  base: {
    padding: "32px",
    textAlign: "center",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "0.95rem",
  },
});

const Divider = styled("div", {
  base: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, var(--md-sys-color-outline-variant), transparent)",
    margin: "8px 0",
  },
});

const JoinRow = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
});

const JoinInput = styled("input", {
  base: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "color-mix(in srgb, var(--md-sys-color-surface-container-high) 80%, transparent)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "0.95rem",
    outline: "none",
    "&::placeholder": {
      color: "var(--md-sys-color-on-surface-variant)",
    },
    "&:focus": {
      borderColor: "var(--md-sys-color-primary)",
    },
  },
});

const ErrorText = styled("span", {
  base: {
    color: "var(--md-sys-color-error)",
    fontSize: "0.85rem",
  },
});
