import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as storage from '@/lib/local-storage';
import { resolveTheme, themeToCSS, DEFAULT_THEME, DEFAULT_SHIKI_THEME, getShikiTheme, } from '@config/theme';
const ThemeContext = createContext(undefined);
const bundledThemeModules = import.meta.glob('../../../resources/themes/*.json', {
    eager: true,
    import: 'default',
});
const BUNDLED_THEMES = new Map(Object.entries(bundledThemeModules).map(([path, theme]) => {
    const fileName = path.split('/').pop() ?? '';
    const id = fileName.replace('.json', '');
    return [id, theme];
}));
function getSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}
function loadStoredTheme() {
    if (typeof window === 'undefined')
        return null;
    return storage.get(storage.KEYS.theme, null);
}
function saveTheme(theme) {
    storage.set(storage.KEYS.theme, theme);
}
export function ThemeProvider({ children, defaultMode = 'system', defaultColorTheme = 'default', defaultFont = 'system', activeWorkspaceId = null }) {
    const stored = loadStoredTheme();
    // === Preference state (persisted at app level) ===
    const [mode, setModeState] = useState(stored?.mode ?? defaultMode);
    // Only use localStorage colorTheme if user explicitly set it via UI
    const [colorTheme, setColorThemeState] = useState(() => {
        if (stored?.isUserOverride && stored.colorTheme) {
            return stored.colorTheme;
        }
        return defaultColorTheme; // Will be updated by config.json effect
    });
    const [font, setFontState] = useState(stored?.font ?? defaultFont);
    const [systemPreference, setSystemPreference] = useState(getSystemPreference);
    const [previewColorTheme, setPreviewColorTheme] = useState(null);
    // === Workspace-level theme override ===
    const [workspaceColorTheme, setWorkspaceColorThemeState] = useState(null);
    // Track if we're receiving an external update to prevent echo broadcasts
    const isExternalUpdate = useRef(false);
    // Load app-level colorTheme from config.json on mount (only if user hasn't overridden)
    useEffect(() => {
        // Skip if user has explicitly set a theme via UI
        if (stored?.isUserOverride)
            return;
        window.electronAPI?.getColorTheme?.().then((configTheme) => {
            if (configTheme && configTheme !== 'default') {
                setColorThemeState(configTheme);
            }
        }).catch(() => {
            // Keep default on error
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount
    // === Preset theme state (singleton) ===
    const [presetTheme, setPresetTheme] = useState(null);
    const [themeResolvedFrom, setThemeResolvedFrom] = useState('none');
    const [themeLoadError, setThemeLoadError] = useState(null);
    // === Derived values ===
    const resolvedMode = mode === 'system' ? systemPreference : mode;
    // Effective theme: preview > workspace override > app default
    const effectiveColorTheme = previewColorTheme ?? workspaceColorTheme ?? colorTheme;
    const effectiveColorThemeSource = previewColorTheme !== null ? 'preview' : workspaceColorTheme !== null ? 'workspace' : 'app';
    const isDarkFromMode = resolvedMode === 'dark';
    // Load workspace theme override when workspace changes
    useEffect(() => {
        if (!activeWorkspaceId) {
            setWorkspaceColorThemeState(null);
            return;
        }
        window.electronAPI?.getWorkspaceColorTheme?.(activeWorkspaceId).then((theme) => {
            setWorkspaceColorThemeState(theme);
        }).catch(() => {
            setWorkspaceColorThemeState(null);
        });
    }, [activeWorkspaceId]);
    // Load preset theme when effectiveColorTheme changes (SINGLETON - only here, not in useTheme)
    useEffect(() => {
        let cancelled = false;
        const applyFallback = (reason) => {
            const fallbackTheme = BUNDLED_THEMES.get(effectiveColorTheme);
            if (fallbackTheme) {
                if (!cancelled) {
                    setPresetTheme(fallbackTheme);
                    setThemeResolvedFrom('fallback');
                    setThemeLoadError(reason);
                }
                console.warn(`[ThemeContext] ${reason} Falling back to bundled theme: ${effectiveColorTheme}`);
                return;
            }
            if (!cancelled) {
                setPresetTheme(null);
                setThemeResolvedFrom('none');
                setThemeLoadError(reason);
            }
            console.error(`[ThemeContext] ${reason} No bundled fallback found for: ${effectiveColorTheme}`);
        };
        if (!effectiveColorTheme || effectiveColorTheme === 'default') {
            setPresetTheme(null);
            setThemeResolvedFrom('none');
            setThemeLoadError(null);
            return () => {
                cancelled = true;
            };
        }
        // Load preset theme via IPC (app-level), then fallback to bundled themes.
        // In playground/browser mode electronAPI may exist without loadPresetTheme.
        const loadPresetTheme = window.electronAPI?.loadPresetTheme;
        if (!loadPresetTheme) {
            applyFallback(`electronAPI.loadPresetTheme is unavailable for "${effectiveColorTheme}".`);
            return () => {
                cancelled = true;
            };
        }
        loadPresetTheme(effectiveColorTheme).then((preset) => {
            if (cancelled)
                return;
            if (preset?.theme) {
                setPresetTheme(preset.theme);
                setThemeResolvedFrom('ipc');
                setThemeLoadError(null);
                return;
            }
            applyFallback(`Preset theme was not returned by IPC for "${effectiveColorTheme}".`);
        }).catch((error) => {
            applyFallback(`Failed to load preset theme via IPC for "${effectiveColorTheme}": ${error instanceof Error ? error.message : String(error)}.`);
        });
        return () => {
            cancelled = true;
        };
    }, [effectiveColorTheme]);
    // Resolve theme (preset → final)
    const resolvedTheme = useMemo(() => {
        return resolveTheme(presetTheme ?? undefined);
    }, [presetTheme]);
    // Determine scenic mode (background image with glass panels)
    const isScenic = useMemo(() => {
        return resolvedTheme.mode === 'scenic' && !!resolvedTheme.backgroundImage;
    }, [resolvedTheme]);
    // Dark-only themes (e.g. Dracula) force dark mode regardless of system mode
    const isDarkOnlyTheme = presetTheme?.supportedModes?.length === 1 && presetTheme.supportedModes[0] === 'dark';
    // isDark reflects actual visual appearance: scenic, dark-only themes, or system dark mode
    const isDark = isScenic || isDarkOnlyTheme ? true : isDarkFromMode;
    // Shiki theme configuration
    const shikiConfig = useMemo(() => {
        return presetTheme?.shikiTheme || DEFAULT_SHIKI_THEME;
    }, [presetTheme]);
    // Get current Shiki theme name based on mode
    const shikiTheme = useMemo(() => {
        const supportedModes = presetTheme?.supportedModes;
        const currentMode = isDark ? 'dark' : 'light';
        // If theme has limited mode support and doesn't include current mode,
        // use the mode it does support for Shiki
        if (supportedModes && supportedModes.length > 0 && !supportedModes.includes(currentMode)) {
            const effectiveMode = supportedModes[0] === 'dark';
            return getShikiTheme(shikiConfig, effectiveMode);
        }
        return getShikiTheme(shikiConfig, isDark);
    }, [shikiConfig, isDark, presetTheme]);
    // === DOM Effects (SINGLETON - all theme DOM manipulation happens here) ===
    // Apply base theme class and data attributes
    useEffect(() => {
        const root = document.documentElement;
        // Apply font
        if (font === 'inter') {
            root.dataset.font = 'inter';
        }
        else {
            delete root.dataset.font;
        }
        // Apply color theme data attribute
        if (effectiveColorTheme && effectiveColorTheme !== 'default') {
            root.dataset.theme = effectiveColorTheme;
        }
        else {
            delete root.dataset.theme;
        }
        // Always set theme override for semi-transparent background (vibrancy effect)
        root.dataset.themeOverride = 'true';
    }, [effectiveColorTheme, font]);
    // Apply dark/light class and theme-specific DOM attributes
    // This runs when preset loads or mode changes
    useEffect(() => {
        const root = document.documentElement;
        // Check if this is a dark-only theme (forces dark mode)
        const isDarkOnlyTheme = presetTheme?.supportedModes?.length === 1 && presetTheme.supportedModes[0] === 'dark';
        // Apply mode class
        // Scenic and dark-only themes force dark mode
        const effectiveMode = (isScenic || isDarkOnlyTheme) ? 'dark' : resolvedMode;
        root.classList.remove('light', 'dark');
        root.classList.add(effectiveMode);
        // Handle themeMismatch - set solid background when:
        // 1. Theme doesn't support current mode (e.g., dark-only Dracula in light mode), OR
        // 2. Resolved mode differs from system preference (vibrancy mismatch)
        const supportedModes = presetTheme?.supportedModes;
        const currentMode = isDarkFromMode ? 'dark' : 'light';
        const themeModeUnsupported = supportedModes && supportedModes.length > 0 && !supportedModes.includes(currentMode);
        const vibrancyMismatch = resolvedMode !== systemPreference;
        if (themeModeUnsupported || vibrancyMismatch) {
            root.dataset.themeMismatch = 'true';
        }
        else {
            delete root.dataset.themeMismatch;
        }
        // Set scenic mode data attribute for CSS targeting
        if (isScenic) {
            root.dataset.scenic = 'true';
            if (resolvedTheme.backgroundImage) {
                root.style.setProperty('--background-image', `url("${resolvedTheme.backgroundImage}")`);
            }
        }
        else {
            delete root.dataset.scenic;
            root.style.removeProperty('--background-image');
        }
    }, [presetTheme, resolvedMode, systemPreference, isScenic, resolvedTheme, isDarkFromMode]);
    // Inject CSS variables
    useEffect(() => {
        const styleId = 'craft-theme-overrides';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        // When using default theme, clear custom CSS
        if (!effectiveColorTheme || effectiveColorTheme === 'default') {
            styleEl.textContent = '';
            return;
        }
        // Only inject CSS when preset is loaded (prevents flash with empty/wrong values)
        if (!presetTheme) {
            // Keep existing CSS while loading
            return;
        }
        // Generate CSS variable declarations
        const cssVars = themeToCSS(resolvedTheme, isDark);
        if (cssVars) {
            styleEl.textContent = `:root {\n  ${cssVars}\n}`;
        }
        else {
            styleEl.textContent = '';
        }
    }, [effectiveColorTheme, presetTheme, resolvedTheme, isDark]);
    // === System preference listener ===
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleMediaChange = (e) => {
            setSystemPreference(e.matches ? 'dark' : 'light');
        };
        mediaQuery.addEventListener('change', handleMediaChange);
        // Listen via Electron IPC if available (more reliable on macOS)
        let cleanup;
        if (window.electronAPI?.onSystemThemeChange) {
            cleanup = window.electronAPI.onSystemThemeChange((isDark) => {
                setSystemPreference(isDark ? 'dark' : 'light');
            });
        }
        // Fetch initial system theme from Electron
        if (window.electronAPI?.getSystemTheme) {
            window.electronAPI.getSystemTheme().then((isDark) => {
                setSystemPreference(isDark ? 'dark' : 'light');
            });
        }
        return () => {
            mediaQuery.removeEventListener('change', handleMediaChange);
            cleanup?.();
        };
    }, []);
    // === Cross-window sync listener ===
    useEffect(() => {
        if (!window.electronAPI?.onThemePreferencesChange)
            return;
        const cleanup = window.electronAPI.onThemePreferencesChange((preferences) => {
            isExternalUpdate.current = true;
            setModeState(preferences.mode);
            setColorThemeState(preferences.colorTheme);
            setFontState(preferences.font);
            // When syncing from another window, mark as user override since user explicitly changed theme
            saveTheme({
                mode: preferences.mode,
                colorTheme: preferences.colorTheme,
                font: preferences.font,
                isUserOverride: true
            });
            setTimeout(() => {
                isExternalUpdate.current = false;
            }, 0);
        });
        return cleanup;
    }, []);
    // === Setters with persistence and broadcast ===
    const setMode = useCallback((newMode) => {
        setModeState(newMode);
        // Preserve existing isUserOverride flag
        const existing = loadStoredTheme();
        saveTheme({ mode: newMode, colorTheme, font, isUserOverride: existing?.isUserOverride });
        if (!isExternalUpdate.current && window.electronAPI?.broadcastThemePreferences) {
            window.electronAPI.broadcastThemePreferences({ mode: newMode, colorTheme, font });
        }
    }, [colorTheme, font]);
    const setColorTheme = useCallback((newTheme) => {
        setColorThemeState(newTheme);
        // Mark as user override - user explicitly changed theme via UI
        saveTheme({ mode, colorTheme: newTheme, font, isUserOverride: true });
        if (!isExternalUpdate.current && window.electronAPI?.broadcastThemePreferences) {
            window.electronAPI.broadcastThemePreferences({ mode, colorTheme: newTheme, font });
        }
    }, [mode, font]);
    const setFont = useCallback((newFont) => {
        setFontState(newFont);
        // Preserve existing isUserOverride flag
        const existing = loadStoredTheme();
        saveTheme({ mode, colorTheme, font: newFont, isUserOverride: existing?.isUserOverride });
        if (!isExternalUpdate.current && window.electronAPI?.broadcastThemePreferences) {
            window.electronAPI.broadcastThemePreferences({ mode, colorTheme, font: newFont });
        }
    }, [mode, colorTheme]);
    // Set workspace-specific color theme override
    const setWorkspaceColorTheme = useCallback((newTheme) => {
        if (!activeWorkspaceId)
            return;
        setWorkspaceColorThemeState(newTheme);
        window.electronAPI?.setWorkspaceColorTheme?.(activeWorkspaceId, newTheme);
        // Broadcast to other windows
        window.electronAPI?.broadcastWorkspaceThemeChange?.(activeWorkspaceId, newTheme);
    }, [activeWorkspaceId]);
    // Listen for workspace theme changes from other windows
    useEffect(() => {
        if (!window.electronAPI?.onWorkspaceThemeChange)
            return;
        const cleanup = window.electronAPI.onWorkspaceThemeChange(({ workspaceId, themeId }) => {
            // Only update if this is our active workspace
            if (workspaceId === activeWorkspaceId) {
                setWorkspaceColorThemeState(themeId);
            }
        });
        return cleanup;
    }, [activeWorkspaceId]);
    return (_jsx(ThemeContext.Provider, { value: {
            // App-level preferences
            mode,
            colorTheme,
            font,
            setMode,
            setColorTheme,
            setFont,
            // Workspace-level theme override
            activeWorkspaceId,
            workspaceColorTheme,
            setWorkspaceColorTheme,
            // Derived
            resolvedMode,
            systemPreference,
            effectiveColorTheme,
            previewColorTheme,
            setPreviewColorTheme,
            effectiveColorThemeSource,
            themeResolvedFrom,
            themeLoadError,
            // Theme resolution (singleton)
            presetTheme,
            resolvedTheme,
            isDark,
            isScenic,
            shikiTheme,
            shikiConfig,
        }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
//# sourceMappingURL=ThemeContext.js.map