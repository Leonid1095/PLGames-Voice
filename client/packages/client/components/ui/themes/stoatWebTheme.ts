import { SelectedTheme } from "@revolt/state/stores/Theme";

/**
 * Generate PLG Voice for Web variables
 * @param theme Theme
 * @returns CSS Variables
 */
export function createPlgVoiceWebVariables(theme: SelectedTheme) {
  return {
    // helper variables
    "--unset-fg": "red",
    "--unset-bg": "linear-gradient(to right, red, blue)",

    // message size
    "--message-size": `${theme.messageSize}px`,
    "--message-group-spacing": `${theme.messageGroupSpacing}px`,

    // emoji size
    "--emoji-size": "1.4em",
    "--emoji-size-medium": "48px",
    "--emoji-size-large": "96px",

    // effects
    "--effects-blur-md": theme.blur ? "blur(20px)" : "unset",
    "--effects-invert-black": theme.darkMode ? "invert(100%)" : "invert(0%)",
    "--effects-invert-light": theme.darkMode ? "invert(0%)" : "invert(1000%)",

    // transitions
    "--transitions-fast": ".15s cubic-bezier(0.2, 0, 0, 1)",
    "--transitions-medium": ".3s cubic-bezier(0.2, 0, 0, 1)",
    "--transitions-slow": ".5s cubic-bezier(0.2, 0, 0, 1)",

    // elevation
    "--elevation-0": "none",
    "--elevation-1": theme.darkMode
      ? "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)"
      : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
    "--elevation-2": theme.darkMode
      ? "0 3px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.35)"
      : "0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)",
    "--elevation-3": theme.darkMode
      ? "0 8px 24px rgba(0,0,0,0.55), 0 3px 8px rgba(0,0,0,0.4)"
      : "0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.08)",
    "--elevation-4": theme.darkMode
      ? "0 12px 32px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.45)"
      : "0 14px 28px rgba(0,0,0,0.18), 0 5px 10px rgba(0,0,0,0.1)",

    // brand
    "--brand-presence-online": "#3ABF7E",
    "--brand-presence-idle": "#F39F00",
    "--brand-presence-busy": "#F84848",
    "--brand-presence-focus": "#4799F0",
    "--brand-presence-invisible": "#A5A5A5",

    // font
    "--fonts-primary": `"${theme.interfaceFont}", "Inter", sans-serif`,
    "--fonts-monospace": `"${theme.monospaceFont}", "Jetbrains Mono", sans-serif`,

    // load constants
    ...reduceWithPrefix(themeConstants.borderRadius, "--borderRadius-"),
    ...reduceWithPrefix(themeConstants.gap, "--gap-"),
    ...reduceWithPrefix(themeConstants.layout, "--layout-"),
  };
}

/**
 * Add prefix to all keys in an object
 * @param object Object
 * @param prefix Prefix
 * @returns New object
 */
function reduceWithPrefix(object: Record<string, string>, prefix: string) {
  return Object.entries(object).reduce(
    (d, [k, v]) => ({ ...d, [`${prefix}${k}`]: v }),
    {},
  );
}

const themeConstants = {
  borderRadius: {
    // Material 3 Expressive ten-level shape scale
    // https://m3.material.io/styles/shape/corner-radius-scale
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "14px",
    lg: "20px",
    li: "20px",
    xl: "32px",
    xli: "32px",
    xxl: "48px",
    full: "calc(infinity * 1px)",
    circle: "100%",
  },
  /**
   * @deprecated decide this at a component level
   */
  gap: {
    none: "0",
    xxs: "1px",
    xs: "2px",
    s: "6px",
    sm: "4px",
    md: "8px",
    l: "12px",
    lg: "15px",
    x: "28px",
    xl: "32px",
    xxl: "64px",
  },
  layout: {
    "width-channel-sidebar": "248px",
    "width-user-context-menu-truncate": "300px",
  },
};
