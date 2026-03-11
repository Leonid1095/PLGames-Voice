import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Button } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

const FEATURES = [
  { icon: "movie", label: () => <Trans>Animated avatar</Trans> },
  { icon: "rocket_launch", label: () => <Trans>Server boosts</Trans> },
  { icon: "add_reaction", label: () => <Trans>Custom stickers</Trans> },
  { icon: "hd", label: () => <Trans>HD streaming</Trans> },
  { icon: "upload_file", label: () => <Trans>Large file uploads</Trans> },
  { icon: "palette", label: () => <Trans>Profile customization</Trans> },
] as const;

/**
 * Premium subscription page
 */
export function EditSubscriptionJoinFlow() {
  return (
    <PageWrapper>
      {/* Hero */}
      <HeroSection>
        <HeroIconWrap>
          <Symbol size={48} fill>
            workspace_premium
          </Symbol>
        </HeroIconWrap>
        <HeroTitle>PLG Voice Premium</HeroTitle>
        <HeroSubtitle>
          <Trans>
            Premium subscriptions are coming soon. Unlock exclusive features and
            support the project.
          </Trans>
        </HeroSubtitle>
        <Badge>
          <Trans>Coming soon</Trans>
        </Badge>
      </HeroSection>

      {/* Features */}
      <SectionTitle>
        <Trans>What you get</Trans>
      </SectionTitle>
      <FeatureGrid>
        {FEATURES.map((f) => (
          <FeatureCard>
            <FeatureIconWrap>
              <Symbol size={24}>{f.icon}</Symbol>
            </FeatureIconWrap>
            <FeatureLabel>{f.label()}</FeatureLabel>
          </FeatureCard>
        ))}
      </FeatureGrid>

      {/* Donate */}
      <DonateSection>
        <DonateIcon>
          <Symbol size={32}>favorite</Symbol>
        </DonateIcon>
        <DonateContent>
          <DonateTitle>
            <Trans>Support PLG Voice</Trans>
          </DonateTitle>
          <DonateText>
            <Trans>
              While Premium is in development, you can support the project with
              a donation.
            </Trans>
          </DonateText>
        </DonateContent>
        <Button
          variant="filled"
          onPress={() =>
            window.open("https://new.donatepay.ru/@lenya", "_blank")
          }
        >
          <Trans>Donate via DonatePay</Trans>
        </Button>
      </DonateSection>
    </PageWrapper>
  );
}

/* ── Styled Components ─────────────────────────────────── */

const PageWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "560px",
    width: "100%",
  },
});

const HeroSection = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "32px 24px",
    borderRadius: "var(--borderRadius-lg)",
    background:
      "linear-gradient(135deg, var(--md-sys-color-primary-container), var(--md-sys-color-surface-container-high))",
    textAlign: "center",
  },
});

const HeroIconWrap = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
    flexShrink: 0,
  },
});

const HeroTitle = styled("h2", {
  base: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.3,
    color: "var(--md-sys-color-on-surface)",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
});

const HeroSubtitle = styled("p", {
  base: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.5,
    color: "var(--md-sys-color-on-surface-variant)",
    maxWidth: "420px",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
});

const Badge = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 14px",
    borderRadius: "100px",
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
});

const SectionTitle = styled("h3", {
  base: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface-variant)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
});

const FeatureGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    width: "100%",
  },
});

const FeatureCard = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container)",
    overflow: "hidden",
  },
});

const FeatureIconWrap = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-primary)",
    flexShrink: 0,
  },
});

const FeatureLabel = styled("span", {
  base: {
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.3,
    color: "var(--md-sys-color-on-surface)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
});

const DonateSection = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px 24px",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container)",
    flexWrap: "wrap",
  },
});

const DonateIcon = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "var(--md-sys-color-error-container)",
    color: "var(--md-sys-color-error)",
    flexShrink: 0,
  },
});

const DonateContent = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: "180px",
  },
});

const DonateTitle = styled("span", {
  base: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--md-sys-color-on-surface)",
  },
});

const DonateText = styled("span", {
  base: {
    fontSize: "13px",
    lineHeight: 1.4,
    color: "var(--md-sys-color-on-surface-variant)",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
});
