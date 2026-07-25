import type { JSX } from "solid-js";

import { I18nProvider as LinguiProvider } from "@lingui-solid/solid";
import { i18n } from "@lingui/core";

import { type LocaleOptions, Language, Languages } from "./Languages";
import { messages as en } from "./catalogs/en/messages";
import { messages as ru } from "./catalogs/ru/messages";
import { initTime, loadTimeLocale } from "./dayjs";

export function I18nProvider(props: { children: JSX.Element }) {
  return <LinguiProvider i18n={i18n}>{props.children}</LinguiProvider>;
}

export { Language, Languages } from "./Languages";
export { timeLocale, useTime } from "./dayjs";
export { useError } from "./errors";

export async function loadAndSwitchLocale(
  key: Language,
  localeOptions: LocaleOptions,
) {
  if (key !== i18n.locale) {
    const data =
      Languages[key].i18n === "en"
        ? en
        : (await import(`./catalogs/${Languages[key].i18n}/messages.ts`))
            .messages;

    i18n.load({
      [key]: data,
    });

    i18n.activate(key);

    loadTimeLocale(Languages[key], localeOptions);
  }
}

/**
 * Initialise i18n engine
 */
export function initI18n() {
  i18n.load({
    en,
    ru,
  });

  i18n.activate("ru");

  initTime();
}

initI18n();
