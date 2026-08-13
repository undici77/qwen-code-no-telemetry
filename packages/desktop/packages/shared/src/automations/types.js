/**
 * Automation System Type Definitions
 *
 * All types, interfaces, and type exports for the automations system.
 */
export const APP_EVENTS = [
    'LabelAdd', 'LabelRemove', 'LabelConfigChange',
    'PermissionModeChange', 'FlagChange', 'SessionStatusChange', 'SchedulerTick'
];
export const AGENT_EVENTS = [
    'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'Notification',
    'UserPromptSubmit', 'SessionStart', 'SessionEnd', 'Stop',
    'SubagentStart', 'SubagentStop', 'PreCompact', 'PermissionRequest', 'Setup'
];
//# sourceMappingURL=types.js.map