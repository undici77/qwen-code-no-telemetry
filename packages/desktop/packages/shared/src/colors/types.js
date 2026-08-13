/**
 * Unified Entity Color Types
 *
 * Shared type definitions for the centralised color system.
 * Used by all entity configs (statuses, labels) for consistent color handling.
 *
 * Two color modes:
 * - System colors: Reference design system CSS variables (auto light/dark via theme)
 * - Custom colors: Explicit CSS color values with optional dark mode override
 *
 * This module is browser-safe (no Node.js dependencies).
 */
/** All valid system color names for runtime validation */
export const SYSTEM_COLOR_NAMES = [
    'accent', 'info', 'success', 'destructive', 'foreground',
];
//# sourceMappingURL=types.js.map