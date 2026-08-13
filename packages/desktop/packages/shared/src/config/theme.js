/**
 * Theme Configuration
 *
 * App-level theme system with preset themes.
 * Light mode is default, with optional dark mode overrides.
 *
 * Storage locations:
 * - App override:   ~/.craft-agent/theme.json
 * - Preset themes:  ~/.craft-agent/themes/*.json
 */
/**
 * Deep merge two theme objects (source wins for defined values)
 */
const COLOR_KEYS = [
    'background',
    'foreground',
    'accent',
    'info',
    'success',
    'destructive',
];
const SURFACE_KEYS = [
    'paper',
    'navigator',
    'input',
    'popover',
    'popoverSolid',
];
// Combined keys for merging (all color properties)
const ALL_COLOR_KEYS = [...COLOR_KEYS, ...SURFACE_KEYS];
function mergeThemes(base, override) {
    if (!base)
        return override || {};
    if (!override)
        return base;
    const result = { ...base };
    // Merge top-level color properties (semantic + surface)
    for (const key of ALL_COLOR_KEYS) {
        if (override[key] !== undefined) {
            result[key] = override[key];
        }
    }
    // Merge scenic mode properties
    if (override.mode !== undefined)
        result.mode = override.mode;
    if (override.backgroundImage !== undefined)
        result.backgroundImage = override.backgroundImage;
    // Deep merge dark overrides
    if (override.dark) {
        result.dark = { ...base.dark };
        for (const key of ALL_COLOR_KEYS) {
            if (override.dark[key] !== undefined) {
                result.dark[key] = override.dark[key];
            }
        }
    }
    return result;
}
/**
 * Resolve theme from app-level source
 * (Workspace cascading has been removed for simplicity)
 */
export function resolveTheme(app) {
    return mergeThemes(undefined, app) || {};
}
/**
 * Convert hex color to RGB values string (e.g., "255, 128, 0")
 * Optionally darkens the color by a factor (0-1, where 0.7 = 70% brightness)
 * Returns null if not a valid hex color
 */
function hexToRgbValues(hex, darkenFactor = 1) {
    let r, g, b;
    // Match 6 digit hex colors
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (match) {
        r = parseInt(match[1], 16);
        g = parseInt(match[2], 16);
        b = parseInt(match[3], 16);
    }
    else {
        // Try 3-digit hex
        const shortMatch = hex.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
        if (!shortMatch)
            return null;
        r = parseInt(shortMatch[1] + shortMatch[1], 16);
        g = parseInt(shortMatch[2] + shortMatch[2], 16);
        b = parseInt(shortMatch[3] + shortMatch[3], 16);
    }
    // Apply darkening factor
    r = Math.round(r * darkenFactor);
    g = Math.round(g * darkenFactor);
    b = Math.round(b * darkenFactor);
    return `${r}, ${g}, ${b}`;
}
/**
 * Generate CSS variable declarations from theme
 * @param theme - Resolved theme object
 * @param isDark - Whether to apply dark mode overrides
 * @returns CSS string with variable declarations
 */
export function themeToCSS(theme, isDark = false) {
    const vars = [];
    // Get effective colors (merge dark overrides if in dark mode)
    const colors = isDark && theme.dark ? { ...theme, ...theme.dark } : theme;
    // Semantic color variables
    if (colors.background)
        vars.push(`--background: ${colors.background};`);
    if (colors.foreground) {
        vars.push(`--foreground: ${colors.foreground};`);
        // Also output RGB version for shadow borders (only works with hex colors)
        const rgbValues = hexToRgbValues(colors.foreground);
        if (rgbValues) {
            vars.push(`--foreground-rgb: ${rgbValues};`);
        }
    }
    if (colors.accent) {
        vars.push(`--accent: ${colors.accent};`);
        // Also output darkened RGB version for shadow-tinted (only works with hex colors)
        // Use 70% brightness for a proper shadow effect
        const rgbValues = hexToRgbValues(colors.accent, 0.7);
        if (rgbValues) {
            vars.push(`--accent-rgb: ${rgbValues};`);
        }
    }
    if (colors.info)
        vars.push(`--info: ${colors.info};`);
    if (colors.success)
        vars.push(`--success: ${colors.success};`);
    if (colors.destructive)
        vars.push(`--destructive: ${colors.destructive};`);
    // Surface color variables (fall back to background if not set)
    // These enable fine-grained control over specific UI regions
    const bg = colors.background || 'var(--background)';
    vars.push(`--paper: ${colors.paper || bg};`);
    vars.push(`--navigator: ${colors.navigator || bg};`);
    vars.push(`--input: ${colors.input || bg};`);
    vars.push(`--popover: ${colors.popover || bg};`);
    // popoverSolid: guaranteed 100% opaque for scenic mode popovers
    // Falls back to popover, then background (should always be solid in scenic themes)
    vars.push(`--popover-solid: ${colors.popoverSolid || colors.popover || bg};`);
    // Theme mode (background image is set directly on document.documentElement.style
    // to avoid style sheet size limits with large data URLs)
    const mode = theme.mode || 'solid';
    vars.push(`--theme-mode: ${mode};`);
    return vars.join('\n  ');
}
/**
 * Hex equivalents of background colors for Electron BrowserWindow.
 * The main process cannot use CSS/oklch colors, so we provide hex values
 * that visually match the DEFAULT_THEME oklch colors.
 */
export const BACKGROUND_HEX = {
    light: '#faf9fb', // matches oklch(0.98 0.003 265)
    dark: '#302f33', // matches oklch(0.2 0.005 270)
};
/**
 * Get background color hex value for BrowserWindow backgroundColor.
 * Use this in the main process where CSS variables aren't available.
 */
export function getBackgroundColor(isDark) {
    return isDark ? BACKGROUND_HEX.dark : BACKGROUND_HEX.light;
}
/**
 * Default theme values (matches current index.css)
 */
export const DEFAULT_THEME = {
    background: 'oklch(0.98 0.003 265)',
    foreground: 'oklch(0.185 0.01 270)',
    accent: 'oklch(0.58 0.22 293)',
    info: 'oklch(0.75 0.16 70)',
    success: 'oklch(0.55 0.17 145)',
    destructive: 'oklch(0.58 0.24 28)',
    dark: {
        background: 'oklch(0.145 0.015 270)',
        foreground: 'oklch(0.95 0.01 270)',
        accent: 'oklch(0.65 0.22 293)',
        info: 'oklch(0.78 0.14 70)',
        success: 'oklch(0.60 0.17 145)',
        destructive: 'oklch(0.65 0.22 28)',
    },
};
/**
 * Default Shiki themes (used when no preset is selected)
 */
export const DEFAULT_SHIKI_THEME = {
    light: 'github-light',
    dark: 'github-dark',
};
/**
 * Get Shiki theme name for current mode
 */
export function getShikiTheme(shikiConfig, isDark) {
    const config = shikiConfig || DEFAULT_SHIKI_THEME;
    return isDark ? config.dark || 'github-dark' : config.light || 'github-light';
}
//# sourceMappingURL=theme.js.map