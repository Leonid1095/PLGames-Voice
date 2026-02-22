import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Button, Column, Text } from "@revolt/ui";

const DonateContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "24px",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container)",
  },
});

/**
 * Donate via DonatePay
 */
export function EditSubscriptionJoinFlow() {
  return (
    <Column gap="lg">
      <DonateContainer>
        <Text class="headline" size="small">
          <Trans>Support PLG Voice</Trans>
        </Text>
        <Text class="body" size="medium">
          <Trans>
            Support the project by donating - thank you!
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
      </DonateContainer>
    </Column>
  );
}
