import { LOCALE_REGISTRY } from "./registry";
/** All supported language codes, derived from the locale registry. */
export const SUPPORTED_LANGUAGE_CODES = Object.keys(LOCALE_REGISTRY);
/** Language display metadata, derived from the locale registry. */
export const LANGUAGES = Object.fromEntries(Object.entries(LOCALE_REGISTRY).map(([code, entry]) => [
    code,
    { nativeName: entry.nativeName },
]));
//# sourceMappingURL=languages.js.map