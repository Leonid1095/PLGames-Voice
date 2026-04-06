import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

/**
 * Skeleton loading placeholder with shimmer animation.
 * Uses the skeletonShimmer keyframe from panda.config.ts.
 */

const skeletonBase = cva({
  base: {
    background:
      "linear-gradient(90deg, var(--md-sys-color-surface-container-high) 25%, var(--md-sys-color-surface-container-highest) 50%, var(--md-sys-color-surface-container-high) 75%)",
    backgroundSize: "400% 100%",
    animation: "skeletonShimmer 1.8s ease-in-out infinite",
  },
  variants: {
    variant: {
      text: {
        height: "14px",
        borderRadius: "var(--borderRadius-sm)",
      },
      avatar: {
        borderRadius: "50%",
        flexShrink: 0,
      },
      card: {
        borderRadius: "var(--borderRadius-md)",
      },
      message: {
        borderRadius: "var(--borderRadius-sm)",
        height: "16px",
      },
    },
    size: {
      xs: {},
      sm: {},
      md: {},
      lg: {},
    },
  },
  compoundVariants: [
    { variant: "avatar", size: "sm", css: { width: "24px", height: "24px" } },
    { variant: "avatar", size: "md", css: { width: "36px", height: "36px" } },
    { variant: "avatar", size: "lg", css: { width: "48px", height: "48px" } },
    { variant: "text", size: "sm", css: { width: "60px" } },
    { variant: "text", size: "md", css: { width: "120px" } },
    { variant: "text", size: "lg", css: { width: "200px" } },
    { variant: "card", size: "sm", css: { height: "60px" } },
    { variant: "card", size: "md", css: { height: "120px" } },
    { variant: "card", size: "lg", css: { height: "200px" } },
  ],
  defaultVariants: {
    variant: "text",
    size: "md",
  },
});

/**
 * Single skeleton element
 */
export function Skeleton(props: {
  variant?: "text" | "avatar" | "card" | "message";
  size?: "xs" | "sm" | "md" | "lg";
  width?: string;
  height?: string;
  class?: string;
}) {
  return (
    <div
      class={`${skeletonBase({ variant: props.variant, size: props.size })} ${props.class ?? ""}`}
      style={{
        ...(props.width ? { width: props.width } : {}),
        ...(props.height ? { height: props.height } : {}),
      }}
    />
  );
}

/**
 * Skeleton message row (avatar + text lines)
 */
export function SkeletonMessage() {
  return (
    <MessageRow>
      <Skeleton variant="avatar" size="md" />
      <TextGroup>
        <Skeleton variant="text" size="lg" height="12px" />
        <Skeleton variant="message" width="80%" />
        <Skeleton variant="message" width="55%" />
      </TextGroup>
    </MessageRow>
  );
}

/**
 * Multiple skeleton messages
 */
export function SkeletonMessages(props: { count?: number }) {
  const count = props.count ?? 5;
  return (
    <MessagesGroup>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonMessage />
      ))}
    </MessagesGroup>
  );
}

const MessageRow = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    padding: "var(--gap-md) var(--gap-lg)",
    alignItems: "flex-start",
  },
});

const TextGroup = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    flexGrow: 1,
    paddingTop: "2px",
  },
});

const MessagesGroup = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-lg)",
    padding: "var(--gap-md)",
  },
});
