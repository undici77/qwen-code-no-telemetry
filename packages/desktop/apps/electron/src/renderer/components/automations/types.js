/**
 * Automation UI Types
 *
 * UI-specific types for the automations components.
 *
 * ARCHITECTURE NOTE: These types are mirrored from packages/shared/src/automations/types.ts.
 * The renderer runs in a browser context and CANNOT import from @craft-agent/shared,
 * which uses Node.js APIs (crypto, fs, etc.). Additionally, the automations package is not
 * exported as a package entry point. These types must be manually kept in sync.
 * Renderer code must not call Node.js APIs directly.
 */
import { computeNextRuns } from './utils';
import { DEFAULT_WEBHOOK_METHOD } from './constants';
export const APP_EVENTS = [
    'LabelAdd', 'LabelRemove', 'LabelConfigChange',
    'PermissionModeChange', 'FlagChange', 'TodoStateChange', 'SessionStatusChange', 'SchedulerTick'
];
export const AGENT_EVENTS = [
    'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'Notification',
    'UserPromptSubmit', 'SessionStart', 'SessionEnd', 'Stop',
    'SubagentStart', 'SubagentStop', 'PreCompact', 'PermissionRequest', 'Setup'
];
/** Human-friendly field names for state conditions */
const FIELD_LABELS = {
    permissionMode: 'permission mode',
    sessionStatus: 'session status',
    isFlagged: 'flagged',
    labels: 'label',
    sessionName: 'session name',
};
/** Get a readable field name, falling back to the raw field */
function fieldLabel(field) {
    return FIELD_LABELS[field] ?? field;
}
/** Produce a short human-readable label for a single leaf condition */
function describeLeaf(c) {
    switch (c.condition) {
        case 'time': {
            const parts = [];
            if (c.weekday?.length)
                parts.push(c.weekday.join(', '));
            if (c.after)
                parts.push(`after ${c.after}`);
            if (c.before)
                parts.push(`before ${c.before}`);
            if (c.timezone)
                parts.push(`(${c.timezone})`);
            return parts.length ? parts.join(' ') : 'any time';
        }
        case 'state': {
            const label = fieldLabel(c.field);
            if (c.from !== undefined || c.to !== undefined) {
                const from = c.from !== undefined ? String(c.from) : 'any';
                const to = c.to !== undefined ? String(c.to) : 'any';
                return `${label} changed from ${from} to ${to}`;
            }
            if (c.contains)
                return `has ${label} "${c.contains}"`;
            if (c.not_value !== undefined) {
                if (c.field === 'isFlagged')
                    return c.not_value ? 'not flagged' : 'is flagged';
                return `${label} is not ${String(c.not_value)}`;
            }
            if (c.value !== undefined) {
                if (c.field === 'isFlagged')
                    return c.value ? 'is flagged' : 'not flagged';
                return `${label} is ${String(c.value)}`;
            }
            return label;
        }
        case 'and':
        case 'or':
        case 'not': {
            const sep = c.condition === 'not' ? ' and not ' : ` ${c.condition} `;
            return c.conditions.map(describeLeaf).join(sep);
        }
        default:
            return 'unknown condition';
    }
}
/**
 * Flatten a condition tree into displayable rows.
 * Logical conditions are expanded so their children appear as joined text.
 * Returns an array of { label, description } for rendering in Info_Table.
 */
export function flattenConditions(conditions) {
    const rows = [];
    for (const c of conditions) {
        if (c.condition === 'and' || c.condition === 'or' || c.condition === 'not') {
            // Flatten: join inner descriptions with the operator
            const sep = c.condition === 'not' ? ' and not ' : ` ${c.condition} `;
            const inner = c.conditions.map(describeLeaf).join(sep);
            // Use the label of the first child type, or 'Condition' as fallback
            const firstChild = c.conditions[0];
            const label = firstChild
                ? firstChild.condition === 'time' ? 'Time'
                    : firstChild.condition === 'state' ? 'State'
                        : 'Condition'
                : 'Condition';
            rows.push({ label, description: inner });
        }
        else {
            const label = c.condition === 'time' ? 'Time' : c.condition === 'state' ? 'State' : 'Condition';
            rows.push({ label, description: describeLeaf(c) });
        }
    }
    return rows;
}
/** Maps task type (from route) to AutomationFilterKind for the list panel */
export const AUTOMATION_TYPE_TO_FILTER_KIND = {
    scheduled: 'scheduled',
    event: 'app',
    agentic: 'agent',
};
// ============================================================================
// Human-Friendly Display Names
// ============================================================================
/** Maps internal event names to user-friendly labels */
export const EVENT_DISPLAY_NAMES = {
    // App events
    LabelAdd: 'Label Added',
    LabelRemove: 'Label Removed',
    LabelConfigChange: 'Label Settings Changed',
    PermissionModeChange: 'Permission Changed',
    FlagChange: 'Flag Changed',
    TodoStateChange: 'Task Updated',
    SessionStatusChange: 'Status Changed',
    SchedulerTick: 'Scheduled',
    // Agent events
    PreToolUse: 'Before Tool Runs',
    PostToolUse: 'After Tool Runs',
    PostToolUseFailure: 'When Tool Fails',
    Notification: 'Notification',
    UserPromptSubmit: 'Message Sent',
    SessionStart: 'Session Started',
    SessionEnd: 'Session Ended',
    Stop: 'Agent Stopped',
    SubagentStart: 'Sub-agent Started',
    SubagentStop: 'Sub-agent Stopped',
    PreCompact: 'Before Memory Cleanup',
    PermissionRequest: 'Permission Requested',
    Setup: 'Initial Setup',
};
export function getEventDisplayName(event) {
    return EVENT_DISPLAY_NAMES[event] ?? event;
}
/** Maps permission mode values to user-friendly labels */
export const PERMISSION_DISPLAY_NAMES = {
    'allow-all': 'YOLO',
    'safe': 'Plan mode',
    'ask': 'Ask before edits',
    'auto-edit': 'Edit automatically',
};
export function getPermissionDisplayName(mode) {
    if (!mode)
        return 'Plan mode';
    return PERMISSION_DISPLAY_NAMES[mode] ?? mode;
}
/** Derive a human-readable name from task actions and event */
function deriveAutomationName(event, matcher) {
    if (matcher.name)
        return matcher.name;
    const allActions = matcher.actions ?? [];
    const firstAction = allActions[0];
    if (!firstAction)
        return getEventDisplayName(event);
    if (firstAction.type === 'webhook') {
        const label = `Webhook ${firstAction.method ?? DEFAULT_WEBHOOK_METHOD} ${firstAction.url}`;
        return label.length > 40 ? label.slice(0, 40) + '...' : label;
    }
    // Extract @skill mentions or use first ~40 chars
    const mentionMatch = firstAction.prompt.match(/@(\S+)/);
    if (mentionMatch)
        return `${mentionMatch[1]} prompt`;
    return firstAction.prompt.length > 40
        ? firstAction.prompt.slice(0, 40) + '...'
        : firstAction.prompt;
}
/** Derive a summary line from the matcher/cron/event */
function deriveAutomationSummary(event, matcher) {
    if (matcher.cron) {
        const runs = computeNextRuns(matcher.cron, 1);
        if (runs.length > 0) {
            const next = runs[0];
            const tz = matcher.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
            const tzCity = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
            const formatted = next.toLocaleString('en-US', {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
                timeZone: tz,
            });
            return `Next run: ${formatted} (${tzCity})`;
        }
        const tz = matcher.timezone ? ` (${matcher.timezone})` : '';
        return `Cron: ${matcher.cron}${tz}`;
    }
    if (matcher.matcher) {
        return `Matches: ${matcher.matcher}`;
    }
    return `On ${getEventDisplayName(event)}`;
}
/**
 * Parse an automations.json file into a flat list of AutomationListItem[].
 * Each matcher entry under each event becomes one item.
 */
export function parseAutomationsConfig(json) {
    if (!json || typeof json !== 'object')
        return [];
    const config = json;
    const eventMap = config.automations;
    if (!eventMap || typeof eventMap !== 'object')
        return [];
    const allEvents = [...APP_EVENTS, ...AGENT_EVENTS];
    const items = [];
    let index = 0;
    for (const [eventName, matchers] of Object.entries(eventMap)) {
        if (!Array.isArray(matchers))
            continue;
        const event = (allEvents.includes(eventName) ? eventName : eventName);
        for (let matcherIdx = 0; matcherIdx < matchers.length; matcherIdx++) {
            const matcher = matchers[matcherIdx];
            const rawActions = matcher.actions;
            if (!rawActions || !Array.isArray(rawActions) || rawActions.length === 0)
                continue;
            const actions = rawActions
                .filter((a) => a.type === 'prompt' || a.type === 'webhook');
            if (actions.length === 0)
                continue;
            items.push({
                id: matcher.id ?? `${eventName}-${index}`,
                event,
                matcherIndex: matcherIdx,
                name: deriveAutomationName(eventName, matcher),
                summary: deriveAutomationSummary(eventName, matcher),
                enabled: matcher.enabled !== false,
                matcher: matcher.matcher,
                cron: matcher.cron,
                timezone: matcher.timezone,
                permissionMode: matcher.permissionMode,
                labels: matcher.labels,
                conditions: matcher.conditions,
                actions,
            });
            index++;
        }
    }
    return items;
}
export function getEventCategory(event) {
    switch (event) {
        case 'SchedulerTick':
            return 'scheduled';
        case 'LabelAdd':
        case 'LabelRemove':
        case 'LabelConfigChange':
            return 'label';
        case 'PermissionModeChange':
        case 'PermissionRequest':
            return 'permission';
        case 'FlagChange':
            return 'flag';
        case 'TodoStateChange':
        case 'SessionStatusChange':
            return 'todo';
        case 'PreToolUse':
        case 'UserPromptSubmit':
        case 'Setup':
        case 'PreCompact':
        case 'SubagentStart':
            return 'agent-pre';
        case 'PostToolUse':
        case 'SessionEnd':
        case 'SubagentStop':
        case 'Stop':
            return 'agent-post';
        case 'PostToolUseFailure':
            return 'agent-error';
        case 'SessionStart':
        case 'Notification':
            return 'session';
        default:
            return 'other';
    }
}
//# sourceMappingURL=types.js.map