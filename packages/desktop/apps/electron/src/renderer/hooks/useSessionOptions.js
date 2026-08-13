/**
 * Session Options Types
 *
 * Type definitions and helpers for session-scoped settings.
 * The actual hook is in AppShellContext.tsx as useSessionOptionsFor().
 *
 * ADDING A NEW SESSION OPTION:
 * 1. Add field to SessionOptions interface below
 * 2. Update defaultSessionOptions
 * 3. Add UI control in FreeFormInput.tsx (or wherever needed)
 */
import { DEFAULT_THINKING_LEVEL } from '@craft-agent/shared/agent/thinking-levels';
/** Default values for new sessions */
export const defaultSessionOptions = {
    permissionMode: 'allow-all', // Default to YOLO mode
    thinkingLevel: DEFAULT_THINKING_LEVEL, // Default to 'medium' level
};
/** Helper to merge session options with updates */
export function mergeSessionOptions(current, updates) {
    return {
        ...defaultSessionOptions,
        ...current,
        ...updates,
    };
}
//# sourceMappingURL=useSessionOptions.js.map