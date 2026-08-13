/**
 * Default Entity Colors
 *
 * Default color assignments for built-in entities (statuses, etc).
 * These are used when an entity config doesn't specify an explicit color.
 *
 * Moved from renderer's todo-states.tsx to shared module so both
 * backend validation and frontend rendering use the same defaults.
 */
// ============================================================================
// Status Defaults
// ============================================================================
/**
 * Default colors for built-in statuses.
 * Uses system colors with opacity modifiers for muted states.
 */
export const DEFAULT_STATUS_COLORS = {
    'backlog': 'foreground/50', // Muted — not yet planned
    'todo': 'foreground/50', // Muted — ready to work on
    'in-progress': 'success', // Green — active work
    'needs-review': 'info', // Amber — attention needed
    'done': 'accent', // Purple — completed
    'cancelled': 'foreground/50', // Muted — inactive
};
/** Fallback color for statuses without explicit color or known default */
export const DEFAULT_STATUS_FALLBACK = 'foreground/50';
/**
 * Get the default color for a status ID.
 * Returns the known default if the status is built-in, otherwise the fallback.
 */
export function getDefaultStatusColor(statusId) {
    return DEFAULT_STATUS_COLORS[statusId] ?? DEFAULT_STATUS_FALLBACK;
}
//# sourceMappingURL=defaults.js.map