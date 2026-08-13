import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ShikiThemeContext - Provides the current Shiki syntax highlighting theme to code blocks
 *
 * This context solves a theming edge case: when a dark-only theme (like Ghostty) is used
 * with system mode set to "auto" and the OS in light mode, the DOM has class "light" but
 * the code blocks should still use the dark shiki theme (e.g., vitesse-dark).
 *
 * Without this context, CodeBlock would check document.documentElement.classList and
 * incorrectly use github-light instead of the theme's configured shiki theme.
 *
 * The shikiTheme value comes from useTheme() which correctly handles:
 * - Theme's shikiTheme config (e.g., { light: 'github-light', dark: 'vitesse-dark' })
 * - Theme's supportedModes (dark-only themes use dark shiki even in "light" system mode)
 * - Scenic mode (forces dark)
 */
import { createContext, useContext } from 'react';
const ShikiThemeContext = createContext({ shikiTheme: null });
/**
 * ShikiThemeProvider - Wraps components to provide the correct Shiki theme
 *
 * Usage:
 * ```tsx
 * const { shikiTheme } = useTheme({ appTheme })
 *
 * <ShikiThemeProvider shikiTheme={shikiTheme}>
 *   <SessionViewer />
 * </ShikiThemeProvider>
 * ```
 */
export function ShikiThemeProvider({ children, shikiTheme }) {
    return (_jsx(ShikiThemeContext.Provider, { value: { shikiTheme }, children: children }));
}
/**
 * useShikiTheme - Access the current Shiki theme in components
 *
 * Returns null if no provider is present, allowing CodeBlock to fall back to
 * DOM-based detection for backwards compatibility.
 */
export function useShikiTheme() {
    const { shikiTheme } = useContext(ShikiThemeContext);
    return shikiTheme;
}
export default ShikiThemeContext;
//# sourceMappingURL=ShikiThemeContext.js.map