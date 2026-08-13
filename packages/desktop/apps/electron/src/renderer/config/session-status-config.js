import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { isEmoji } from '@craft-agent/shared/utils/icon-constants';
import { resolveEntityColor, getDefaultStatusColor } from '@craft-agent/shared/colors';
import { StatusIcon } from '@/components/ui/status-icon';
import { iconCache } from '@/lib/icon-cache';
const DEFAULT_STATUS_IDS = new Set([
    'backlog',
    'todo',
    'needs-review',
    'done',
    'cancelled',
]);
export function getSessionStatusDisplayLabel(state, t) {
    if (!t || !DEFAULT_STATUS_IDS.has(state.id))
        return state.label;
    return t(`status.${state.id}`, state.label);
}
// ============================================================================
// Status → SessionStatus Conversion
// ============================================================================
/**
 * Convert StatusConfig to SessionStatus.
 * Resolves EntityColor to a CSS color string for inline style use.
 * System colors (e.g., "accent") resolve to CSS variable references that
 * auto-adapt to light/dark theme. Custom colors use isDark to pick the right value.
 *
 * Colorability is determined synchronously:
 * - Emoji icons → not colorable (they have their own colors)
 * - Everything else (SVGs, fallback) → colorable (uses currentColor)
 */
export function statusConfigToSessionStatus(config, workspaceId, isDark) {
    // Emojis have their own colors and don't respond to CSS color inheritance.
    // SVGs with currentColor and the fallback Circle icon are colorable.
    const iconColorable = !isEmoji(config.icon);
    // Resolve EntityColor → CSS color string for inline style
    const entityColor = config.color ?? getDefaultStatusColor(config.id);
    const resolvedColor = resolveEntityColor(entityColor, isDark);
    return {
        id: config.id,
        label: config.label,
        color: config.color,
        resolvedColor,
        icon: (_jsx(StatusIcon, { statusId: config.id, icon: config.icon, workspaceId: workspaceId, size: "xs", chromeless: !iconColorable })),
        iconColorable,
        category: config.category,
        isFixed: config.isFixed,
        isDefault: config.isDefault,
    };
}
/**
 * Convert array of StatusConfig to SessionStatus[]
 */
export function statusConfigsToSessionStatuses(configs, workspaceId, isDark) {
    return configs.map(c => statusConfigToSessionStatus(c, workspaceId, isDark));
}
// ============================================================================
// Helper Functions (updated to work with dynamic states)
// ============================================================================
/**
 * Get the icon for a todo state
 */
export function getStateIcon(stateId, states) {
    const state = states.find(s => s.id === stateId);
    return state?.icon ?? _jsx("span", { className: "h-3.5 w-3.5", children: "\u25CF" });
}
/**
 * Return inline style for a status icon only when the icon is colorable.
 *
 * Colorable icons (SVG/currentColor) receive the resolved status color.
 * Non-colorable icons (emoji/images) return undefined so they render at full native color/opacity.
 */
export function getStatusIconStyle(state) {
    return state?.iconColorable ? { color: state.resolvedColor } : undefined;
}
/**
 * Resolve a status by ID and return icon style only when color should be applied.
 */
export function getStateIconStyle(stateId, states) {
    return getStatusIconStyle(states.find(s => s.id === stateId));
}
/**
 * Get the resolved CSS color for a todo state (ready for inline style)
 */
export function getStateColor(stateId, states) {
    return states.find(s => s.id === stateId)?.resolvedColor;
}
/**
 * Get the label for a todo state
 */
export function getStateLabel(stateId, states) {
    const state = states.find(s => s.id === stateId);
    return state?.label ?? stateId;
}
/**
 * Get a complete state object by ID
 */
export function getState(stateId, states) {
    return states.find(s => s.id === stateId);
}
/**
 * Clear status icon cache (useful when statuses are updated).
 * Clears status-prefixed entries from the unified icon cache.
 */
export function clearIconCache() {
    for (const key of iconCache.keys()) {
        if (key.startsWith('status:'))
            iconCache.delete(key);
    }
}
//# sourceMappingURL=session-status-config.js.map