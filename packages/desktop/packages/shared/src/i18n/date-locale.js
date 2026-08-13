import { enUS } from "date-fns/locale/en-US";
import { LOCALE_REGISTRY } from "./registry";
/** Get the date-fns Locale matching the current i18n language code. */
export function getDateLocale(lang) {
    const entry = LOCALE_REGISTRY[lang];
    return entry?.dateLocale ?? enUS;
}
//# sourceMappingURL=date-locale.js.map