import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Button, Column, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "32px 24px",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container)",
  },
});

const FeatureGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    width: "100%",
    maxWidth: "600px",
  },
});

const FeatureItem = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "14px",
  },
});

const Badge = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "var(--borderRadius-full)",
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
});

/**
 * Premium subscription page
 */
export function EditSubscriptionJoinFlow() {
  return (
    <Column gap="lg">
      <Card>
        <Badge>
          <Trans>Coming soon</Trans>
        </Badge>
        <Text class="headline" size="small">
          <Trans>PLG Voice Premium</Trans>
        </Text>
        <Text
          class="body"
          size="medium"
          style={{ "text-align": "center", "max-width": "480px" }}
        >
          <Trans>
            Premium subscriptions are coming soon. Subscribe to unlock exclusive
            features and support the project.
          </Trans>
        </Text>

        <FeatureGrid>
          <FeatureItem>
            <Symbol size={20}>movie</Symbol>
            <Trans>Animated avatar</Trans>
          </FeatureItem>
          <FeatureItem>
            <Symbol size={20}>rocket_launch</Symbol>
            <Trans>Server boosts</Trans>
          </FeatureItem>
          <FeatureItem>
            <Symbol size={20}>add_reaction</Symbol>
            <Trans>Custom stickers</Trans>
          </FeatureItem>
          <FeatureItem>
            <Symbol size={20}>hd</Symbol>
            <Trans>HD streaming</Trans>
          </FeatureItem>
          <FeatureItem>
            <Symbol size={20}>upload_file</Symbol>
            <Trans>Large file uploads</Trans>
          </FeatureItem>
          <FeatureItem>
            <Symbol size={20}>palette</Symbol>
            <Trans>Profile customization</Trans>
          </FeatureItem>
        </FeatureGrid>
      </Card>

      <Card>
        <Text class="headline" size="small">
          <Trans>Support PLG Voice</Trans>
        </Text>
        <Text class="body" size="medium" style={{ "text-align": "center" }}>
          <Trans>
            While Premium is in development, you can support the project with a
            donation.
          </Trans>
        </Text>
        <Button
          variant="filled"
          onPress={() =>
            window.open("https://new.donatepay.ru/@lenya", "_blank")
          }
        >
          <Trans>Donate via DonatePay</Trans>
        </Button>
      </Card>
    </Column>
  );
}
