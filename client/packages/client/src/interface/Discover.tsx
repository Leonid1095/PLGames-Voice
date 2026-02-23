import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useNavigate } from "@revolt/routing";
import { Button } from "@revolt/ui";

import MdExplore from "@material-design-icons/svg/filled/explore.svg?component-solid";

/**
 * Discover placeholder (stt.gg unavailable)
 */
export function Discover() {
  const navigate = useNavigate();

  return (
    <Base>
      <Content>
        <MdExplore width={64} height={64} />
        <Title>
          <Trans>Server discovery coming soon</Trans>
        </Title>
        <Description>
          <Trans>
            Browse and discover servers will be available in a future update.
          </Trans>
        </Description>
        <Button onPress={() => navigate("/")}>
          <Trans>Back to home</Trans>
        </Button>
      </Content>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    width: "100%",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--md-sys-color-on-surface)",
  },
});

const Content = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "32px",
    fill: "var(--md-sys-color-on-surface-variant)",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const Title = styled("h2", {
  base: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface)",
  },
});

const Description = styled("p", {
  base: {
    margin: 0,
    fontSize: "0.95rem",
    textAlign: "center",
    maxWidth: "360px",
  },
});
