import { createContext, useContext } from 'react';
export const WebShellThemeId = {
    Dark: 'dark',
    Light: 'light',
};
export const WEB_SHELL_THEMES = [
    WebShellThemeId.Dark,
    WebShellThemeId.Light,
];
const ThemeContext = createContext(WebShellThemeId.Dark);
export const ThemeProvider = ThemeContext.Provider;
export function useTheme() {
    return useContext(ThemeContext);
}
export const THEME_SETTING_KEY = 'ui.theme';
export const LANGUAGE_SETTING_KEY = 'general.language';
export function themeSettingToWebShellTheme(value, fallback) {
    if (value === WebShellThemeId.Light || value === 'Qwen Light')
        return WebShellThemeId.Light;
    if (value === WebShellThemeId.Dark || value === 'Qwen Dark')
        return WebShellThemeId.Dark;
    return fallback;
}
export function webShellThemeToSettingValue(theme) {
    return theme === WebShellThemeId.Light ? 'Qwen Light' : 'Qwen Dark';
}
//# sourceMappingURL=themeContext.js.map