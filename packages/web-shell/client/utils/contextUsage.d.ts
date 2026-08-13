/**
 * Shared severity thresholds for context-window occupancy, used by the
 * composer ring and the /context panel so the two surfaces never disagree
 * about when usage turns warning or error.
 */
export declare const CONTEXT_USAGE_WARNING_PCT = 60;
export declare const CONTEXT_USAGE_ERROR_PCT = 80;
export type ContextUsageLevel = 'normal' | 'warning' | 'error';
export declare function getContextUsageLevel(pct: number): ContextUsageLevel;
