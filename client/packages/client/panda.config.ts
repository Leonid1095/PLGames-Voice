import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      keyframes: {
        materialPhysicsButtonSelect: {
          "0%": {
            paddingInline: "var(--padding-inline)",
          },
          "50%": {
            paddingInline: "calc(var(--padding-inline) + 8px)",
          },
          "100%": {
            paddingInline: "var(--padding-inline)",
          },
        },
        scrimFadeIn: {
          "0%": {
            background: "transparent",
          },
          "100%": {
            background: "var(--background)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          },
        },
        slideIn: {
          "0%": {
            transform: "translateY(var(--translateY))",
          },
          "100%": {
            transform: "translateY(0px)",
          },
        },
        highlightMessage: {
          "0%": {
            background: "transparent",
          },
          "5%": {
            background: "var(--md-sys-color-primary-container)",
          },
          "95%": {
            background: "var(--md-sys-color-primary-container)",
          },
          "100%": {
            background: "transparent",
          },
        },
        skeletonShimmer: {
          "0%": {
            backgroundPosition: "200% 0",
          },
          "100%": {
            backgroundPosition: "-200% 0",
          },
        },
        contentFadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(8px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.4",
          },
        },
        popIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.92)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        fadeSlideUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(6px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        typingBounce: {
          "0%, 60%, 100%": {
            transform: "translateY(0)",
          },
          "30%": {
            transform: "translateY(-4px)",
          },
        },
        toastSlideIn: {
          "0%": {
            transform: "translateX(100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",

  // Enable jsx code gen
  jsxFramework: "solid",

  // Use template style
  // syntax: "template-literal",
});
