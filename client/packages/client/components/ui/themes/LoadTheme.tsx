import { createEffect } from "solid-js";

import { useState } from "@revolt/state";

import {
  createMaterialColourVariables,
  createMduiColourTriplets,
  createPlgVoiceWebVariables,
} from ".";
import { Masks } from "./Masks";
import { FONTS, MONOSPACE_FONTS } from "./fonts";
import { legacyThemeUnsetShim } from "./legacyThemeGeneratorCode";

/**
 * Component for loading theme variables into root
 */
export function LoadTheme() {
  const state = useState();

  createEffect(() => {
    const activeTheme = state.theme.activeTheme;

    // load fonts
    FONTS[state.theme.interfaceFont].load();
    MONOSPACE_FONTS[state.theme.monospaceFont].load();

    // Set bg on both <html> and <body> so the canvas (area outside body)
    // matches the user's selected theme. MDUI's own :root stylesheet
    // would otherwise paint light lavender on the canvas in dark mode.
    // Must match the surface ramps pinned in materialTheme.ts, or the canvas
    // outside <body> shows a different shade than the app itself.
    const bg = activeTheme.darkMode ? "#100E15" : "#FBF9F7";
    document.documentElement.style.background = bg;
    document.documentElement.style.colorScheme = activeTheme.darkMode ? "dark" : "light";
    document.body.style.background = bg;

    for (const [key, value] of Object.entries({
      // create unset variables to indicate where colours need replacing
      ...Object.keys(legacyThemeUnsetShim().colours).reduce(
        (d, k) => ({
          ...d,
          [`--colours-${k}`]: k.includes("background")
            ? "var(--unset-bg)"
            : "var(--unset-fg)",
        }),
        {},
      ),
      // mount PLG Voice for Web variables
      ...createPlgVoiceWebVariables(activeTheme),
      // mount --md-sys-color variables
      ...createMaterialColourVariables(activeTheme, "--md-sys-color-"),
      // mount --mdui-color triplet variables
      ...createMduiColourTriplets(activeTheme, "--mdui-color-"),
    })) {
      document.body.style.setProperty(key, value);
    }
  });

  return <Masks />;
}
