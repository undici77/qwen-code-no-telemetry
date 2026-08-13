/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function selectDaemonPendingPermissions(blocks) {
    return blocks.filter((block) => block.kind === 'permission' && block.resolved === undefined);
}
export function selectDaemonTodoLists(blocks) {
    return blocks.flatMap((block) => {
        if (block.kind !== 'tool')
            return [];
        const items = extractDaemonTodosFromToolBlock(block);
        if (!items)
            return [];
        const rawOutput = getRecord(block.rawOutput);
        const plan = getRecord(rawOutput?.['plan']);
        const planId = getString(plan, 'id');
        const sourceCallId = getString(plan, 'sourceCallId');
        return [
            {
                blockId: block.id,
                toolCallId: block.toolCallId,
                title: block.title,
                status: block.status,
                ...(planId ? { planId } : {}),
                ...(sourceCallId ? { sourceCallId } : {}),
                items,
                raw: block,
            },
        ];
    });
}
export function selectDaemonLatestTodoList(blocks) {
    return selectDaemonTodoLists(blocks).at(-1);
}
export function selectDaemonActiveTodoList(blocks) {
    const latest = selectDaemonLatestTodoList(blocks);
    // Only the latest list is considered active; earlier active items are stale
    // once a newer TodoWrite/plan snapshot has arrived.
    return latest && hasDaemonActiveTodos(latest.items) ? latest : undefined;
}
export function extractDaemonTodosFromToolBlock(block) {
    const toolName = (block.toolName ?? '').toLowerCase();
    const toolKind = (block.toolKind ?? '').toLowerCase();
    const isTodoTool = toolName === 'todowrite' ||
        toolName === 'todo_write' ||
        toolKind === 'updated_plan' ||
        toolKind === 'todo';
    if (!isTodoTool && toolKind !== 'other') {
        return undefined;
    }
    const rawOutput = getRecord(block.rawOutput);
    const hasPlanMetadata = getString(getRecord(rawOutput?.['plan']), 'id') !== undefined;
    const rawInput = getRecord(block.rawInput);
    const inputTodos = getTodoArray(rawInput);
    if (inputTodos) {
        const todos = parseDaemonTodoItemsFromEntries(inputTodos);
        return todos.length > 0 || isTodoTool ? todos : undefined;
    }
    const outputTodos = getTodoArray(rawOutput);
    if (outputTodos) {
        const todos = parseDaemonTodoItemsFromEntries(outputTodos);
        return todos.length > 0 || isTodoTool || hasPlanMetadata
            ? todos
            : undefined;
    }
    const entries = Array.isArray(rawOutput?.['entries'])
        ? rawOutput['entries']
        : undefined;
    if (!entries)
        return undefined;
    const todos = parseDaemonTodoItemsFromEntries(entries);
    return todos.length > 0 || isTodoTool || hasPlanMetadata ? todos : undefined;
}
export function parseDaemonTodoItemsFromEntries(entries) {
    const todos = entries.flatMap((entry, index) => {
        const item = getRecord(entry);
        const content = getString(item, 'content');
        if (!content)
            return [];
        const meta = getRecord(item?.['_meta']);
        const qwenTodo = getRecord(meta?.['qwenTodo']);
        const id = getString(qwenTodo, 'id') ?? getString(item, 'id') ?? `plan-${index}`;
        const blockedBy = getStringArray(qwenTodo, 'blockedBy');
        return [
            {
                id,
                content,
                status: getTodoStatus(getString(item, 'status')),
                ...(blockedBy ? { blockedBy } : {}),
                ...(() => {
                    const priority = getTodoPriority(getString(item, 'priority'));
                    return priority ? { priority } : {};
                })(),
            },
        ];
    });
    return todos;
}
export function hasDaemonActiveTodos(items) {
    return items.some((item) => item.status === 'pending' || item.status === 'in_progress');
}
export function isDaemonSubAgentToolBlock(block) {
    const toolName = (block.toolName ?? '').toLowerCase();
    if (toolName === 'agent' || toolName === 'task')
        return true;
    if (block.parentToolCallId || block.parentBlockId || block.subagentType) {
        return true;
    }
    if (isTaskExecutionRaw(block.rawOutput))
        return true;
    const rawInput = getRecord(block.rawInput);
    return Boolean(getString(rawInput, 'subagent_type'));
}
export function selectDaemonSubAgentToolBlocks(blocks) {
    return blocks.filter((block) => block.kind === 'tool' && isDaemonSubAgentToolBlock(block));
}
export function selectDaemonTranscriptStreamingState(blocks) {
    if (blocks.length === 0)
        return 'idle';
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'thought' && isStreamingTextBlock(last)) {
        return 'thinking';
    }
    if (last?.kind === 'assistant' && isStreamingTextBlock(last)) {
        return 'responding';
    }
    if (last?.kind === 'tool' && isRunningToolBlock(last)) {
        return 'responding';
    }
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        if (block.kind === 'user')
            break;
        if (block.kind === 'tool' && isRunningToolBlock(block)) {
            return 'responding';
        }
    }
    return 'idle';
}
export function selectDaemonStreamingState(blocks, promptStatus) {
    const transcriptState = selectDaemonTranscriptStreamingState(blocks);
    // `promptStatus` is sourced from the daemon/session action state and is the
    // authority for whether the current prompt is active after load/resume.
    // Replayed transcript blocks may still contain stale running tool states.
    if (promptStatus === 'idle') {
        return 'idle';
    }
    if (transcriptState !== 'idle') {
        return transcriptState;
    }
    if (promptStatus === undefined) {
        return transcriptState;
    }
    return promptStatus === 'waiting' ? 'waiting' : 'responding';
}
function isStreamingTextBlock(block) {
    return block.streaming === true;
}
function isRunningToolBlock(block) {
    return block.status === 'running' || block.status === 'in_progress';
}
function getTodoArray(record) {
    const todos = record?.['todos'];
    return Array.isArray(todos) ? todos : undefined;
}
function getTodoStatus(value) {
    return value === 'completed' || value === 'in_progress' || value === 'pending'
        ? value
        : 'pending';
}
function getTodoPriority(value) {
    return value === 'high' || value === 'medium' || value === 'low'
        ? value
        : undefined;
}
function isTaskExecutionRaw(raw) {
    const record = getRecord(raw);
    return record?.['type'] === 'task_execution';
}
function getRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
function getString(record, key) {
    const value = record?.[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function getStringArray(record, key) {
    const value = record?.[key];
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? value
        : undefined;
}
//# sourceMappingURL=selectors.js.map