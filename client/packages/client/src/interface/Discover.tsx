import { For, Show, createMemo, createSignal } from "solid-js";
import { Compass, Search, Users } from "lucide-solid";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Avatar, Button, Column, Text } from "@revolt/ui";

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? "");
      setJoinError(msg || t`Failed to join`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <Base>
      <Container>
        <Header>
          <Compass width={32} height={32} />
          <h2>
            <Trans>Browse servers</Trans>
          </h2>
        </Header>

        <SearchBox>
          <Search width={20} height={20} />
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
                        <Users width={14} height={14} />
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
    // Page title gets the full display treatment — condensed capitals. This
    // is chrome, not user content, so uppercase is safe here.
    "& h2": {
      margin: 0,
      fontSize: "var(--pd-text-3xl)",
      fontFamily: "var(--pd-font-display)",
      fontVariationSettings: '"wght" 700, "wdth" var(--pd-display-wdth)',
      fontWeight: "var(--pd-weight-bold)",
      lineHeight: "var(--pd-leading-tight)",
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      color: "var(--md-sys-color-on-surface)",
    },
  },
});

const SearchBox = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 14px",
    borderRadius: "8px",
    background: "var(--pd-tint-subtle)",
    border: "1px solid var(--pd-border-default)",
    fill: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
    transition: "border-color var(--pd-transition-fast), box-shadow var(--pd-transition-fast)",
    _focusWithin: {
      borderColor: "var(--md-sys-color-primary)",
      boxShadow: "0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent)",
    },
    "& input": {
      flex: 1,
      border: "none",
      background: "transparent",
      color: "var(--md-sys-color-on-surface)",
      fontSize: "14px",
      letterSpacing: "-0.005em",
      outline: "none",
      "&::placeholder": {
        color: "color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent)",
      },
    },
  },
});

const SectionTitle = styled("h3", {
  base: {
    margin: 0,
    // Mono label, same as sidebar categories and status readouts, rather than
    // the body face at 600 with its own one-off tracking value.
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    fontWeight: "var(--pd-weight-regular)",
    textTransform: "uppercase",
    letterSpacing: "var(--pd-tracking-label)",
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
    borderRadius: "var(--pd-radius-lg)",
    cursor: "pointer",
    background: "var(--pd-surface-raised)",
    border: "1px solid var(--pd-border-subtle)",
    boxShadow: "var(--pd-shadow-raised)",
    transition:
      "border-color var(--pd-transition-base), transform var(--pd-transition-base), box-shadow var(--pd-transition-base)",
    // A 32% black drop shadow was tuned for a near-black page. On paper it
    // read as a bruise under every card; --pd-shadow-float is the same idea
    // scaled to a light surface.
    "&:hover": {
      borderColor: "var(--pd-border-default)",
      boxShadow: "var(--pd-shadow-float)",
      transform: "translateY(-2px)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "&:hover": { transform: "none" },
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
    gap: "5px",
    // Member counts line up down the grid column, so they get fixed-width
    // digits — otherwise every card's number sat at a slightly different width.
    fontFamily: "var(--pd-font-mono)",
    fontSize: "var(--pd-text-xs)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "var(--pd-tracking-wide)",
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
    background: "var(--pd-border-subtle)",
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
