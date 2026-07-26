import { createEffect } from "solid-js";

import { useState } from "@revolt/state";

import {
  createMaterialColourVariables,
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
    const bg = activeTheme.darkMode ? "#121110" : "#FBF9F7";
    document.documentElement.style.background = bg;
    document.documentElement.style.colorScheme = activeTheme.darkMode ? "dark" : "light";
    document.body.style.background = bg;

    // Lets stylesheets branch on the mode the user actually picked rather than
    // on prefers-color-scheme, which ignores the in-app toggle. Read by the
    // direction-dependent tokens in polden.css, e.g. --pd-surface-raised.
    document.documentElement.dataset.mode = activeTheme.darkMode
      ? "dark"
      : "light";

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
    })) {
      // On <html>, not <body>. polden.css derives thirteen --pd-* tokens from
      // these (--pd-surface-raised, the borders, the interaction tints, the
      // focus ring, the accent washes) and declares them in :root. A custom
      // property is substituted at the element that declares it, then the
      // *resolved* value is what inherits — so a :root token referring to a
      // variable that only exists on <body> is guaranteed-invalid at :root and
      // inherits as invalid all the way down. Every one of those tokens read
      // as empty everywhere, which is why raised surfaces, borders and hover
      // states were missing while the literal tokens (fonts, radii, --pd-live)
      // worked: the redesign's colour landed and its structure did not.
      document.documentElement.style.setProperty(key, value);
    }
  });

  return <Masks />;
}
