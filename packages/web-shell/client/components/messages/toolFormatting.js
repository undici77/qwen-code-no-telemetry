export { isActiveToolStatus } from '../../adapters/toolClassification';
/**
 * Internal-tool-name → display-name lookup. This is a standalone copy of
 * core's `ToolDisplayNames` (mapped to wire names, as the CLI's shared
 * `tool-display-map.ts` does): the web-shell is a browser bundle and
 * intentionally does not depend on `@qwen-code/qwen-code-core`, so the map
 * can't be imported. Keep the canonical tool entries in sync with core's
 * `ToolDisplayNames`; the extra lowercase ACP aliases below (bash, read,
 * write, …) are web-shell-only conveniences with no core equivalent.
 */
export const TOOL_DISPLAY_NAMES = {
    edit: 'Edit',
    write_file: 'WriteFile',
    read_file: 'ReadFile',
    zoom_image: 'ZoomImage',
    grep: 'Grep',
    grep_search: 'Grep',
    glob: 'Glob',
    run_shell_command: 'Shell',
    todo_write: 'TodoList',
    get_goal: 'Goal',
    update_goal: 'UpdateGoal',
    save_memory: 'SaveMemory',
    agent: 'Agent',
    skill: 'Skill',
    exit_plan_mode: 'ExitPlanMode',
    web_fetch: 'WebFetch',
    webfetch: 'WebFetch',
    fetch: 'WebFetch',
    list_directory: 'ListFiles',
    lsp: 'Lsp',
    ask_user_question: 'AskUserQuestion',
    cron_create: 'CronCreate',
    cron_list: 'CronList',
    cron_delete: 'CronDelete',
    loop_wakeup: 'LoopWakeup',
    create_sub_session: 'CreateSubSession',
    task_stop: 'TaskStop',
    list_agents: 'ListAgents',
    send_message: 'SendMessage',
    structured_output: 'StructuredOutput',
    monitor: 'Monitor',
    notebook_edit: 'NotebookEdit',
    tool_search: 'ToolSearch',
    read_mcp_resource: 'ReadMcpResource',
    enter_worktree: 'EnterWorktree',
    exit_worktree: 'ExitWorktree',
    enter_plan_mode: 'EnterPlanMode',
    task_create: 'TaskCreate',
    task_update: 'TaskUpdate',
    task_list: 'TaskList',
    team_create: 'TeamCreate',
    team_delete: 'TeamDelete',
    team_plan_approval: 'TeamPlanApproval',
    workflow: 'Workflow',
    artifact: 'Artifact',
    record_artifact: 'RecordArtifact',
    web_search: 'WebSearch',
    image_gen: 'ImageGen',
    display_image: 'DisplayImage',
    bash: 'Shell',
    shell: 'Shell Command',
    read: 'ReadFile',
    write: 'WriteFile',
    search: 'Grep',
};
/**
 * Escape bare C0/C1 control characters (BEL, BS, CR, DEL, ESC, the 8-bit
 * CSI, …) to inert, visible text, mirroring the CLI's
 * `sanitizeMultilineForDisplay`. React escapes HTML but not control bytes,
 * so LLM-generated tool descriptions carrying a stray `\r`/BEL/ESC would
 * otherwise garble the rendered panel. `\n`/`\t` are excluded — callers
 * collapse whitespace before rendering single-line labels.
 */
// Matches bare C0/C1 control bytes but not `\n`/`\t` (mirrors the CLI's
// MULTILINE_CONTROL_CHARS_REGEX), plus the Unicode bidi embedding/isolate
// controls (U+202A–202E, U+2066–2069) so a crafted filename can't visually
// reorder or spoof its extension (bidi/"trojan source" style attacks).
/* eslint-disable no-control-regex */
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0b-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g;
/* eslint-enable no-control-regex */
export function sanitizeControlChars(text) {
    return text.replace(CONTROL_CHARS_REGEX, (ch) => {
        switch (ch) {
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            case '\r':
                return '\\r';
            default:
                return `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`;
        }
    });
}
export function formatToolDisplayName(toolName) {
    if (!toolName.trim())
        return 'Tool';
    const exact = TOOL_DISPLAY_NAMES[toolName];
    if (exact)
        return exact;
    const lower = toolName.toLowerCase();
    if (lower === 'web_fetch' || lower === 'webfetch' || lower === 'fetch') {
        return 'WebFetch';
    }
    return toolName;
}
/**
 * Locale-aware tool display name for chat-stream badges. Looks up the
 * `toolName.<wire_name>` i18n key; when the active language has no entry the
 * translator returns the key verbatim, in which case we fall back to the
 * English {@link formatToolDisplayName}. Pass the `t` from `useI18n()`.
 */
export function localizeToolDisplayName(toolName, t) {
    const displayName = formatToolDisplayName(toolName);
    const keys = [
        `toolName.${toolName}`,
        `toolName.${toolName.toLowerCase()}`,
        `toolName.${displayName.toLowerCase()}`,
    ];
    for (const key of keys) {
        const translated = t(key);
        if (translated !== key)
            return translated;
    }
    return displayName;
}
export function isAskUserQuestionToolName(toolName) {
    const normalized = toolName.toLowerCase();
    return normalized === 'ask_user_question' || normalized === 'askuserquestion';
}
export function truncateText(text, max) {
    if (text.length <= max)
        return text;
    return text.slice(0, max) + '...';
}
// The tool-header description is shown single-line (CSS-ellipsised) when the
// row is collapsed and fully wrapped when it is expanded, so we keep the whole
// string rather than hard-capping it at a line's worth of characters. A
// generous ceiling still guards against a pathological multi-megabyte command
// bloating the DOM.
const MAX_DESCRIPTION_LENGTH = 2000;
export function getToolDescription(tool, workspaceCwd) {
    if (isSkillToolName(tool.toolName)) {
        const skillName = getStringArg(tool.args, 'skill');
        if (skillName)
            return truncateText(skillName, MAX_DESCRIPTION_LENGTH);
    }
    const fromTitle = getDescriptionFromTitle(tool, workspaceCwd);
    if (fromTitle)
        return truncateText(fromTitle, MAX_DESCRIPTION_LENGTH);
    const fromArgs = getDescriptionFromArgs(tool, workspaceCwd);
    if (fromArgs)
        return truncateText(fromArgs, MAX_DESCRIPTION_LENGTH);
    return '';
}
export function getToolSummaryDescription(tool, workspaceCwd) {
    if (!isShellToolName(tool.toolName)) {
        return getToolDescription(tool, workspaceCwd);
    }
    const description = getStringArg(tool.args, 'description');
    if (description)
        return truncateText(description, MAX_DESCRIPTION_LENGTH);
    const fromArgs = getDescriptionFromArgs(tool, workspaceCwd, {
        includeTimeout: false,
    });
    if (fromArgs)
        return truncateText(fromArgs, MAX_DESCRIPTION_LENGTH);
    return '';
}
export function getShellToolSemanticDescription(tool) {
    if (!isShellToolName(tool.toolName))
        return '';
    return getStringArg(tool.args, 'description');
}
export function extractText(tool) {
    if (!tool.content) {
        return extractRawOutputText(tool.rawOutput);
    }
    for (const b of tool.content) {
        if (b.type === 'content' && b.content?.text)
            return b.content.text;
    }
    return extractRawOutputText(tool.rawOutput);
}
export function getToolResultSummary(tool) {
    if (tool.status !== 'completed' && tool.status !== 'failed')
        return '';
    const name = tool.toolName.toLowerCase();
    if (name === 'grep_search' || name === 'grep' || name === 'search') {
        const rawSummary = parseGrepSummary((extractRawOutputText(tool.rawOutput) ?? '').trim());
        if (rawSummary)
            return rawSummary;
    }
    const text = extractText(tool);
    if (!text)
        return '';
    const lines = text.split('\n');
    const lineCount = lines.length;
    if (name === 'read' || name === 'read_file' || name === 'readfile') {
        return `${lineCount} line(s)`;
    }
    if (name === 'glob') {
        const itemCount = lines.filter((l) => l.trim()).length;
        return `Found ${itemCount} matching file(s)`;
    }
    if (name === 'list_directory' || name === 'listfiles') {
        const itemCount = lines.filter((l) => l.trim()).length;
        return `${itemCount} item(s)`;
    }
    if (isShellToolName(name)) {
        if (lineCount > 3)
            return `${lineCount} lines of output`;
        const firstLine = lines[0] || '';
        return truncateText(firstLine, 80);
    }
    if (name === 'grep_search' || name === 'grep' || name === 'search') {
        const summary = parseGrepSummary(text.trim());
        if (summary)
            return summary;
        const matchCount = lines.filter((l) => l.trim()).length;
        return `${matchCount} result(s)`;
    }
    if (name === 'edit' ||
        name === 'write' ||
        name === 'write_file' ||
        name === 'editfile') {
        return '';
    }
    if (name === 'webfetch' || name === 'web_fetch' || name === 'fetch') {
        const firstLine = lines[0] || '';
        return truncateText(firstLine, 80);
    }
    if (name === 'websearch' || name === 'web_search') {
        const matchCount = lines.filter((l) => l.trim()).length;
        if (matchCount > 1)
            return `${matchCount} result(s)`;
        return lines[0] || '';
    }
    if (isAskUserQuestionToolName(name))
        return '';
    const firstLine = lines[0] || '';
    return truncateText(firstLine, 80);
}
function getDescriptionFromTitle(tool, workspaceCwd) {
    if (!tool.title)
        return null;
    const displayName = formatToolDisplayName(tool.toolName);
    const title = tool.title.trim();
    if (title === tool.toolName || title === displayName)
        return null;
    const prefixes = [displayName, tool.toolName];
    for (const prefix of prefixes) {
        if (title.startsWith(prefix)) {
            const suffix = title.slice(prefix.length);
            if (/^(:\s*|\s+)/.test(suffix)) {
                return formatDescriptionPaths(suffix.replace(/^:\s*|\s+/, ''), workspaceCwd);
            }
        }
    }
    return formatDescriptionPaths(title, workspaceCwd);
}
function parseGrepSummary(text) {
    if (text === 'No matches found')
        return text;
    if (/^Found \d+ match(?:es)?(?: \(truncated\))?$/.test(text))
        return text;
    return null;
}
function getDescriptionFromArgs(tool, workspaceCwd, options = {}) {
    const args = tool.args || {};
    const name = tool.toolName.toLowerCase();
    const includeTimeout = options.includeTimeout ?? true;
    if (args.command) {
        let description = String(args.command);
        if (args.directory && name !== 'shell') {
            description += ` [in ${pathForDisplay(String(args.directory), workspaceCwd)}]`;
        }
        if (args.is_background) {
            description += ' [background]';
        }
        else if (includeTimeout && args.timeout) {
            description += ` [timeout: ${String(args.timeout)}ms]`;
        }
        const argDescription = getStringArg(args, 'description');
        if (argDescription) {
            description += ` (${argDescription})`;
        }
        return truncateText(description, MAX_DESCRIPTION_LENGTH);
    }
    if (name === 'grep_search' || name === 'grep' || name === 'search') {
        const pattern = args.pattern ?? args.query;
        if (pattern) {
            let description = `'${String(pattern)}'`;
            if (args.path) {
                description += ` in path '${String(args.path)}'`;
            }
            else if (name === 'grep_search' || name === 'grep') {
                description += ` in path './'`;
            }
            if (args.glob)
                description += ` (filter: '${String(args.glob)}')`;
            return description;
        }
    }
    if (name === 'glob' && args.pattern) {
        let description = `'${String(args.pattern)}'`;
        if (args.path) {
            description += ` in path '${String(args.path)}'`;
        }
        return description;
    }
    if (args.file_path) {
        if (args.description)
            return String(args.description);
        return pathForDisplay(String(args.file_path), workspaceCwd);
    }
    if (args.url) {
        const url = String(args.url);
        const prompt = typeof args.prompt === 'string' ? args.prompt : undefined;
        const desc = prompt ? `${url} — "${truncateText(prompt, 40)}"` : url;
        return truncateText(desc, 80);
    }
    if (args.path)
        return pathForDisplay(String(args.path), workspaceCwd);
    if (args.query) {
        return truncateText(String(args.query), 60);
    }
    if (name === 'list_directory' || name === 'listfiles') {
        const candidate = args.path || args.directory || '';
        return pathForDisplay(String(candidate), workspaceCwd);
    }
    if (args.description)
        return String(args.description);
    return '';
}
function getStringArg(args, key) {
    const value = args?.[key];
    return typeof value === 'string' ? value.trim().replace(/\n/g, ' ') : '';
}
export function isShellToolName(name) {
    const normalized = name.toLowerCase();
    return (normalized === 'run_shell_command' ||
        normalized === 'bash' ||
        normalized === 'shell' ||
        normalized === 'execute_command');
}
export function isSkillToolName(name) {
    return name.toLowerCase() === 'skill';
}
export function toolContainsCallId(tool, toolCallId) {
    if (tool.callId === toolCallId)
        return true;
    return (tool.subTools?.some((sub) => toolContainsCallId(sub, toolCallId)) ?? false);
}
function formatDescriptionPaths(description, workspaceCwd) {
    const trimmed = description.trim();
    if (isAbsoluteLikePath(normalizeSeparators(trimmed))) {
        return pathForDisplay(trimmed, workspaceCwd);
    }
    return trimmed.replace(/(?:[A-Za-z]:)?\/[^\s'")]+/g, (match) => pathForDisplay(match, workspaceCwd));
}
function pathForDisplay(filePath, workspaceCwd) {
    const normalizedPath = normalizeSeparators(filePath);
    const normalizedCwd = workspaceCwd
        ? normalizeSeparators(workspaceCwd).replace(/\/+$/, '')
        : '';
    if (normalizedCwd &&
        (normalizedPath === normalizedCwd ||
            normalizedPath.startsWith(`${normalizedCwd}/`))) {
        const relativePath = normalizedPath.slice(normalizedCwd.length + 1);
        return relativePath || '.';
    }
    if (isAbsoluteLikePath(normalizedPath)) {
        return basename(normalizedPath);
    }
    return normalizedPath;
}
function normalizeSeparators(filePath) {
    return filePath.replace(/\\/g, '/');
}
function isAbsoluteLikePath(filePath) {
    return filePath.startsWith('/') || /^[A-Za-z]:\//.test(filePath);
}
function basename(filePath) {
    const trimmed = filePath.replace(/\/+$/, '');
    return trimmed.split('/').pop() || filePath;
}
// ── Shared agent helpers (used by ParallelAgentsGroup & SubAgentPanel) ──
export function getTaskExecutionRecord(rawOutput) {
    if (!rawOutput || typeof rawOutput !== 'object')
        return undefined;
    const record = rawOutput;
    return record['type'] === 'task_execution' ? record : undefined;
}
export function getAgentCancellationReason(agent) {
    if (!agent.rawOutput || typeof agent.rawOutput !== 'object')
        return '';
    const raw = agent.rawOutput;
    const terminateReason = typeof raw.terminateReason === 'string' ? raw.terminateReason : '';
    return ((typeof raw.reason === 'string' && raw.reason) ||
        (terminateReason && terminateReason !== 'GOAL' && terminateReason) ||
        (typeof raw.error === 'string' && raw.error) ||
        '');
}
export function isAgentCancelled(agent) {
    if (!agent.rawOutput || typeof agent.rawOutput !== 'object')
        return false;
    const raw = agent.rawOutput;
    const status = typeof raw.status === 'string' ? raw.status.toLowerCase() : '';
    const reason = getAgentCancellationReason(agent);
    return (status === 'cancelled' ||
        status === 'canceled' ||
        reason.toLowerCase().includes('cancel'));
}
export function getAgentDisplayStatus(agent) {
    if (agent.status === 'failed')
        return 'failed';
    if (isAgentCancelled(agent))
        return 'failed';
    return agent.status;
}
export function formatTokenCount(tokens) {
    if (tokens >= 1000000)
        return `${(tokens / 1000000).toFixed(1)}M tokens`;
    if (tokens >= 1000)
        return (tokens / 1000).toFixed(1).replace(/\.0$/, '') + 'k tokens';
    return `${tokens} tokens`;
}
const DEFAULT_SUBAGENT_TYPE = 'general-purpose';
export function getAgentType(agent) {
    const taskExec = getTaskExecutionRecord(agent.rawOutput);
    if (taskExec) {
        const name = taskExec['subagentName'];
        if (typeof name === 'string' && name)
            return name;
    }
    const subagentType = agent.args?.subagent_type;
    if (typeof subagentType === 'string' && subagentType)
        return subagentType;
    return agent.toolName === 'task' ? 'task' : DEFAULT_SUBAGENT_TYPE;
}
// 'task' is getAgentType's other untyped-agent fallback and has no i18n key.
export function isDefaultAgentType(agentType) {
    return (agentType.toLowerCase() === DEFAULT_SUBAGENT_TYPE || agentType === 'task');
}
/**
 * Locale-aware agent type display name. Looks up `agentType.<name>`
 * (case-insensitive) via the translator; falls back to the raw name
 * for user-defined agents that have no i18n entry.
 */
export function localizeAgentTypeName(agentType, t) {
    const keys = [
        `agentType.${agentType}`,
        `agentType.${agentType.toLowerCase()}`,
    ];
    for (const key of keys) {
        const translated = t(key);
        if (translated !== key)
            return translated;
    }
    return agentType;
}
export function getAgentDescription(agent) {
    if (agent.title) {
        const colonIdx = agent.title.indexOf(': ');
        if (colonIdx > 0)
            return agent.title.slice(colonIdx + 2);
    }
    const desc = agent.args?.description;
    if (typeof desc === 'string' && desc.trim())
        return desc.trim();
    const taskExec = getTaskExecutionRecord(agent.rawOutput);
    const taskDesc = taskExec?.['taskDescription'];
    if (typeof taskDesc === 'string' && taskDesc.trim())
        return taskDesc.trim();
    const prompt = agent.args?.prompt;
    if (typeof prompt === 'string' && prompt.trim()) {
        return prompt.trim().split('\n')[0] ?? '';
    }
    return '';
}
export function getAgentCurrentToolHint(agent, t) {
    if (agent.status !== 'in_progress')
        return '';
    const subs = agent.subTools;
    if (!subs || subs.length === 0)
        return '';
    const last = subs[subs.length - 1];
    if (last.status !== 'in_progress' && last.status !== 'pending')
        return '';
    let hint = localizeToolDisplayName(last.toolName ?? '', t);
    if (last.title) {
        const colonIdx = last.title.indexOf(': ');
        hint += ' ' + (colonIdx > 0 ? last.title.slice(colonIdx + 2) : last.title);
    }
    else if (last.args?.command) {
        hint += ' ' + String(last.args.command);
    }
    else if (last.args?.file_path) {
        hint += ' ' + String(last.args.file_path);
    }
    return truncateText(hint, 50);
}
function extractRawOutputText(rawOutput) {
    if (!rawOutput)
        return null;
    if (typeof rawOutput === 'string')
        return rawOutput;
    if (typeof rawOutput !== 'object')
        return null;
    const raw = rawOutput;
    if (typeof raw.output === 'string')
        return raw.output;
    if (typeof raw.stdout === 'string')
        return raw.stdout;
    if (typeof raw.content === 'string')
        return raw.content;
    if (typeof raw.reason === 'string')
        return raw.reason;
    if (typeof raw.terminateReason === 'string')
        return raw.terminateReason;
    if (typeof raw.error === 'string')
        return raw.error;
    if (typeof raw.text === 'string')
        return raw.text;
    return null;
}
//# sourceMappingURL=toolFormatting.js.map