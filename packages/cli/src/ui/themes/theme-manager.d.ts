/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Theme, ThemeType, CustomTheme } from './theme.js';
import type { SemanticColors } from './semantic-tokens.js';
export interface ThemeDisplay {
    name: string;
    type: ThemeType;
    isCustom?: boolean;
}
export declare const DEFAULT_THEME: Theme;
export declare const AUTO_THEME_NAME = "auto";
declare class ThemeManager {
    private readonly availableThemes;
    private activeTheme;
    private customThemes;
    constructor();
    /**
     * Loads custom themes from settings.
     * @param customThemesSettings Custom themes from settings.
     */
    loadCustomThemes(customThemesSettings?: Record<string, CustomTheme>): void;
    /**
     * Sets the active theme.
     * @param themeName The name of the theme to set as active.
     *   If themeName is 'auto', detects the terminal theme and selects
     *   Qwen Dark or Qwen Light accordingly.
     * @returns True if the theme was successfully set, false otherwise.
     */
    setActiveTheme(themeName: string | undefined): boolean;
    /**
     * Cached auto-detection result. Populated by the async probe at startup
     * (which includes OSC 11) and reused by subsequent sync resolutions so
     * reselecting Auto in the /theme dialog never contradicts what was shown
     * when the app first rendered.
     */
    private cachedAutoDetection;
    /**
     * Detects the terminal's dark/light preference (synchronous) and returns
     * the corresponding Qwen theme.
     * Used by the theme dialog for instant preview. Prefers the cached
     * async-detected value when available so we stay consistent with the
     * OSC 11 probe performed at startup.
     */
    private resolveAutoTheme;
    /**
     * Asynchronous auto-detection that includes an OSC 11 probe.
     * Intended for startup where a short async delay (~200 ms) is acceptable.
     * The resolved value is cached so later sync resolutions (e.g. the /theme
     * dialog reselecting Auto) stay in sync with what the probe detected.
     */
    resolveAutoThemeAsync(): Promise<void>;
    /**
     * Gets the currently active theme.
     * @returns The active theme.
     */
    getActiveTheme(): Theme;
    /**
     * Gets the semantic colors for the active theme.
     * @returns The semantic colors.
     */
    getSemanticColors(): SemanticColors;
    /**
     * Gets a list of custom theme names.
     * @returns Array of custom theme names.
     */
    getCustomThemeNames(): string[];
    /**
     * Checks if a theme name is a custom theme.
     * @param themeName The theme name to check.
     * @returns True if the theme is custom.
     */
    isCustomTheme(themeName: string): boolean;
    /**
     * Returns a list of available theme names.
     */
    getAvailableThemes(): ThemeDisplay[];
    /**
     * Gets a theme by name.
     * @param themeName The name of the theme to get.
     * @returns The theme if found, undefined otherwise.
     */
    getTheme(themeName: string): Theme | undefined;
    private isPath;
    private loadThemeFromFile;
    findThemeByName(themeName: string | undefined): Theme | undefined;
}
export declare const themeManager: ThemeManager;
export {};
