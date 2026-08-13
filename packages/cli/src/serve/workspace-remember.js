/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { randomUUID } from 'node:crypto';
import { WorkspaceDrainingError } from './acp-session-bridge.js';
import { createWorkspaceMemoryExtractionErrorLogger, shouldSuppressRememberErrorDetails, workspaceMemoryFailureCode, workspaceMemoryFailureDiagnostics, } from '../runtime/workspace-remember-errors.js';
import { MAX_REMEMBER_CONTENT_BYTES } from '../runtime/workspace-memory-remember-constants.js';
import { formatWorkspaceMemoryDreamSummary, formatWorkspaceMemoryForgetSummary, } from '../runtime/workspace-memory-summaries.js';
const debugLogger = createDebugLogger('WORKSPACE_REMEMBER');
function requireTrustedWorkspace(deps, res) {
    if (deps.isWorkspaceTrusted?.() !== false)
        return true;
    res.status(403).json({
        error: 'Workspace is not trusted.',
        code: 'untrusted_workspace',
    });
    return false;
}
function requireOpenGeneration(assertGenerationOpen, res) {
    try {
        assertGenerationOpen?.();
        return true;
    }
    catch {
        res.set('Retry-After', '1');
        res.status(503).json({
            error: 'Workspace runtime is not active.',
            code: 'workspace_runtime_unavailable',
        });
        return false;
    }
}
function nowIso() {
    return new Date().toISOString();
}
function createMemoryTaskId(kind) {
    return `${kind}-${randomUUID()}`;
}
function touchedScopesFromTopics(topics) {
    const scopes = new Set();
    for (const topic of topics) {
        scopes.add(topic === 'user' || topic === 'feedback' ? 'user' : 'project');
    }
    return [...scopes];
}
function cloneTask(task) {
    const base = {
        taskId: task.taskId,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        error: task.error ? { ...task.error } : undefined,
    };
    if (task.kind === 'remember') {
        return {
            ...base,
            contextMode: task.contextMode,
            result: task.result
                ? {
                    ...task.result,
                    filesTouched: [...task.result.filesTouched],
                    touchedScopes: [...task.result.touchedScopes],
                }
                : undefined,
        };
    }
    if (task.kind === 'forget') {
        return {
            ...base,
            result: task.result
                ? {
                    ...task.result,
                    removedEntries: task.result.removedEntries.map((entry) => ({
                        ...entry,
                    })),
                    touchedTopics: [...task.result.touchedTopics],
                    touchedScopes: [...task.result.touchedScopes],
                }
                : undefined,
        };
    }
    return {
        ...base,
        result: task.result
            ? {
                ...task.result,
                touchedTopics: [...task.result.touchedTopics],
            }
            : undefined,
    };
}
export function publicErrorMessage(code, kind) {
    if (code === 'managed_memory_unavailable') {
        return 'Managed memory is unavailable for this daemon workspace.';
    }
    if (code === 'remember_path_escape') {
        return 'Remember agent touched a path outside managed memory.';
    }
    if (code === 'remember_queue_full') {
        return kind === 'remember'
            ? 'Workspace memory remember queue is full.'
            : 'Workspace memory task queue is full.';
    }
    if (code === 'workspace_draining') {
        return 'Workspace runtime is being removed.';
    }
    if (code === 'remember_timeout' ||
        code === 'forget_timeout' ||
        code === 'dream_timeout') {
        return `Workspace memory ${kind} timed out.`;
    }
    return `Workspace memory ${kind} failed.`;
}
export function publicErrorStatus(code) {
    if (code === 'workspace_draining')
        return 503;
    if (code === 'remember_queue_full')
        return 429;
    if (code === 'managed_memory_unavailable')
        return 409;
    return 500;
}
function createTaskError(code, kind, details) {
    const error = {
        code,
        message: publicErrorMessage(code, kind),
    };
    if (shouldSuppressRememberErrorDetails(code))
        return error;
    return {
        ...error,
        ...(details ? { details } : {}),
    };
}
const logWorkspaceMemoryExtractionError = createWorkspaceMemoryExtractionErrorLogger(debugLogger);
export class WorkspaceRememberTaskLane {
    bridge;
    workspaceCwd;
    static MAX_TASKS = 1000;
    static TERMINAL_TASK_TTL_MS = 5 * 60_000;
    // Two-tier pending capacity: all tasks share the global cap, while
    // forget/dream share a smaller sub-cap so bursts cannot starve remember.
    static MAX_PENDING = 16;
    static MAX_NON_REMEMBER_PENDING = 8;
    static NON_REMEMBER_KINDS = new Set(['forget', 'dream']);
    tasks = new Map();
    tail = Promise.resolve();
    draining = false;
    disposed = false;
    constructor(bridge, workspaceCwd = 'workspace') {
        this.bridge = bridge;
        this.workspaceCwd = workspaceCwd;
    }
    beginDrain() {
        this.draining = true;
    }
    cancelDrain() {
        if (!this.disposed)
            this.draining = false;
    }
    pendingCount() {
        return this.pendingCounts().total;
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.draining = true;
        for (const task of this.tasks.values()) {
            if (task.status !== 'queued')
                continue;
            task.status = 'failed';
            task.updatedAt = nowIso();
            task.error = createTaskError('workspace_removed', task.kind, 'Workspace runtime was removed before the task started.');
        }
    }
    failRunningTaskAfterRemoval(task) {
        if (!this.disposed || task.status === 'completed')
            return;
        task.status = 'failed';
        delete task.result;
        task.updatedAt = nowIso();
        task.error = createTaskError('workspace_removed', task.kind, 'Workspace runtime was removed while the task was running.');
    }
    pendingCounts() {
        let total = 0;
        let nonRemember = 0;
        for (const task of this.tasks.values()) {
            if (task.status !== 'queued' && task.status !== 'running')
                continue;
            total++;
            if (WorkspaceRememberTaskLane.NON_REMEMBER_KINDS.has(task.kind)) {
                nonRemember++;
            }
        }
        return { total, nonRemember };
    }
    evictTerminalTasks(nowMs = Date.now()) {
        const cutoffMs = nowMs - WorkspaceRememberTaskLane.TERMINAL_TASK_TTL_MS;
        for (const [id, task] of this.tasks) {
            if (task.status !== 'completed' && task.status !== 'failed')
                continue;
            const updatedAtMs = Date.parse(task.updatedAt);
            if (!Number.isNaN(updatedAtMs) && updatedAtMs <= cutoffMs) {
                this.tasks.delete(id);
            }
            else if (Number.isNaN(updatedAtMs)) {
                debugLogger.warn('Task with unparseable updatedAt skipped for TTL eviction:', {
                    taskId: id,
                    updatedAt: task.updatedAt,
                });
            }
        }
        if (this.tasks.size <= WorkspaceRememberTaskLane.MAX_TASKS)
            return;
        for (const [id, task] of this.tasks) {
            if (task.status === 'completed' || task.status === 'failed') {
                this.tasks.delete(id);
                if (this.tasks.size <= WorkspaceRememberTaskLane.MAX_TASKS)
                    break;
            }
        }
    }
    assertCapacity(kind) {
        if (this.draining || this.disposed) {
            throw new WorkspaceDrainingError(this.workspaceCwd);
        }
        const pending = this.pendingCounts();
        if (pending.total >= WorkspaceRememberTaskLane.MAX_PENDING) {
            throw Object.assign(new Error('Workspace memory task queue is full'), {
                code: 'remember_queue_full',
            });
        }
        // Keep forget/dream from occupying the whole serial lane so remember stays
        // available during heavier destructive or compaction bursts.
        if (WorkspaceRememberTaskLane.NON_REMEMBER_KINDS.has(kind) &&
            pending.nonRemember >= WorkspaceRememberTaskLane.MAX_NON_REMEMBER_PENDING) {
            throw Object.assign(new Error('Workspace memory task queue is full'), {
                code: 'remember_queue_full',
            });
        }
    }
    queue(task, run) {
        this.tasks.set(task.taskId, task);
        this.evictTerminalTasks();
        const runIfQueued = async () => {
            if (task.status !== 'queued')
                return;
            await run();
        };
        this.tail = this.tail.then(runIfQueued, runIfQueued);
        void this.tail.catch((err) => {
            debugLogger.error('Unhandled task lane error:', err);
        });
        return cloneTask(task);
    }
    publishManagedMemoryChanged(params) {
        if (params.touchedScopes.length === 0)
            return;
        try {
            this.bridge.publishWorkspaceEvent({
                type: 'memory_changed',
                data: {
                    scope: 'managed',
                    source: params.source,
                    taskId: params.taskId,
                    touchedScopes: params.touchedScopes,
                },
                ...(params.originatorClientId
                    ? { originatorClientId: params.originatorClientId }
                    : {}),
            });
        }
        catch (err) {
            debugLogger.error('Failed to publish memory_changed event:', err);
        }
    }
    enqueue(params) {
        this.assertCapacity('remember');
        const task = {
            kind: 'remember',
            taskId: createMemoryTaskId('remember'),
            status: 'queued',
            contextMode: params.contextMode,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            ...(params.originatorClientId
                ? { originatorClientId: params.originatorClientId }
                : {}),
        };
        const run = async () => {
            task.status = 'running';
            task.updatedAt = nowIso();
            try {
                params.assertGenerationOpen?.();
                const result = await this.bridge.runWorkspaceMemoryRemember({
                    content: params.content,
                    contextMode: params.contextMode,
                });
                params.assertGenerationOpen?.();
                if (!this.disposed) {
                    task.status = 'completed';
                    task.result = {
                        summary: result.filesTouched.length > 0
                            ? 'Memory update completed.'
                            : 'No memory files updated.',
                        filesTouched: result.filesTouched,
                        touchedScopes: result.touchedScopes,
                    };
                    task.updatedAt = nowIso();
                }
            }
            catch (err) {
                const code = workspaceMemoryFailureCode(err, 'remember_failed', logWorkspaceMemoryExtractionError);
                const diagnostics = workspaceMemoryFailureDiagnostics(err, logWorkspaceMemoryExtractionError);
                debugLogger.error('Workspace memory remember task failed:', {
                    taskId: task.taskId,
                    code,
                    details: diagnostics.debugDetails,
                    ...(diagnostics.stack ? { stack: diagnostics.stack } : {}),
                });
                task.status = 'failed';
                task.error = createTaskError(code, task.kind, diagnostics.details);
                task.updatedAt = nowIso();
            }
            this.failRunningTaskAfterRemoval(task);
            try {
                if (task.status === 'completed' && task.result) {
                    this.publishManagedMemoryChanged({
                        source: 'workspace_memory_remember',
                        taskId: task.taskId,
                        touchedScopes: task.result.touchedScopes,
                        ...(params.originatorClientId
                            ? { originatorClientId: params.originatorClientId }
                            : {}),
                    });
                }
            }
            finally {
                this.evictTerminalTasks();
            }
        };
        return this.queue(task, run);
    }
    enqueueForget(params) {
        this.assertCapacity('forget');
        const task = {
            kind: 'forget',
            taskId: createMemoryTaskId('forget'),
            status: 'queued',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            ...(params.originatorClientId
                ? { originatorClientId: params.originatorClientId }
                : {}),
        };
        const run = async () => {
            task.status = 'running';
            task.updatedAt = nowIso();
            try {
                params.assertGenerationOpen?.();
                const result = await this.bridge.runWorkspaceMemoryForget({
                    query: params.query,
                });
                params.assertGenerationOpen?.();
                if (!this.disposed) {
                    task.status = 'completed';
                    task.result = {
                        summary: result.summary ??
                            formatWorkspaceMemoryForgetSummary(result.removedEntries.length),
                        removedEntries: result.removedEntries,
                        touchedTopics: result.touchedTopics,
                        touchedScopes: result.touchedScopes,
                    };
                    task.updatedAt = nowIso();
                }
            }
            catch (err) {
                const code = workspaceMemoryFailureCode(err, 'forget_failed', logWorkspaceMemoryExtractionError);
                const diagnostics = workspaceMemoryFailureDiagnostics(err, logWorkspaceMemoryExtractionError);
                debugLogger.error('Workspace memory forget task failed:', {
                    taskId: task.taskId,
                    code,
                    details: diagnostics.debugDetails,
                    ...(diagnostics.stack ? { stack: diagnostics.stack } : {}),
                });
                task.status = 'failed';
                task.error = createTaskError(code, task.kind, diagnostics.details);
                task.updatedAt = nowIso();
            }
            this.failRunningTaskAfterRemoval(task);
            try {
                if (task.status === 'completed' && task.result) {
                    this.publishManagedMemoryChanged({
                        source: 'workspace_memory_forget',
                        taskId: task.taskId,
                        touchedScopes: task.result.touchedScopes,
                        ...(params.originatorClientId
                            ? { originatorClientId: params.originatorClientId }
                            : {}),
                    });
                }
            }
            finally {
                this.evictTerminalTasks();
            }
        };
        return this.queue(task, run);
    }
    enqueueDream(params) {
        this.assertCapacity('dream');
        const task = {
            kind: 'dream',
            taskId: createMemoryTaskId('dream'),
            status: 'queued',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            ...(params.originatorClientId
                ? { originatorClientId: params.originatorClientId }
                : {}),
        };
        const run = async () => {
            task.status = 'running';
            task.updatedAt = nowIso();
            try {
                params.assertGenerationOpen?.();
                const result = await this.bridge.runWorkspaceMemoryDream();
                params.assertGenerationOpen?.();
                if (!this.disposed) {
                    task.status = 'completed';
                    task.result = {
                        summary: result.summary ??
                            formatWorkspaceMemoryDreamSummary(result.touchedTopics.length),
                        touchedTopics: result.touchedTopics,
                        dedupedEntries: result.dedupedEntries,
                    };
                    task.updatedAt = nowIso();
                }
            }
            catch (err) {
                const code = workspaceMemoryFailureCode(err, 'dream_failed', logWorkspaceMemoryExtractionError);
                const diagnostics = workspaceMemoryFailureDiagnostics(err, logWorkspaceMemoryExtractionError);
                debugLogger.error('Workspace memory dream task failed:', {
                    taskId: task.taskId,
                    code,
                    details: diagnostics.debugDetails,
                    ...(diagnostics.stack ? { stack: diagnostics.stack } : {}),
                });
                task.status = 'failed';
                task.error = createTaskError(code, task.kind, diagnostics.details);
                task.updatedAt = nowIso();
            }
            this.failRunningTaskAfterRemoval(task);
            try {
                if (task.status === 'completed' && task.result) {
                    this.publishManagedMemoryChanged({
                        source: 'workspace_memory_dream',
                        taskId: task.taskId,
                        touchedScopes: touchedScopesFromTopics(task.result.touchedTopics),
                        ...(params.originatorClientId
                            ? { originatorClientId: params.originatorClientId }
                            : {}),
                    });
                }
            }
            finally {
                this.evictTerminalTasks();
            }
        };
        return this.queue(task, run);
    }
    get(taskId, requesterClientId, kind) {
        const task = this.tasks.get(taskId);
        if (!task)
            return undefined;
        if (kind && task.kind !== kind)
            return undefined;
        if (task.originatorClientId) {
            if (task.originatorClientId !== requesterClientId)
                return undefined;
        }
        else if (requesterClientId) {
            return undefined;
        }
        return cloneTask(task);
    }
}
function validateOriginatorClientId(deps, req, res) {
    const clientId = deps.parseClientId(req, res);
    if (clientId === null)
        return null;
    if (clientId === undefined)
        return undefined;
    const known = deps.bridge.knownClientIds();
    if (!known.has(clientId)) {
        res.status(400).json({
            error: `Client id "${clientId}" is not registered for this workspace`,
            code: 'invalid_client_id',
            clientId,
        });
        return null;
    }
    return clientId;
}
async function validateManagedMemoryAvailable(deps, res, kind, assertGenerationOpen) {
    try {
        const available = await deps.bridge.isWorkspaceMemoryRememberAvailable();
        if (!available) {
            res.status(409).json({
                error: 'Managed memory is unavailable for this daemon workspace',
                code: 'managed_memory_unavailable',
            });
            return false;
        }
        return true;
    }
    catch (err) {
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return false;
        debugLogger.error('Availability check failed:', err);
        const code = `${kind}_failed`;
        res.status(500).json({
            error: publicErrorMessage(code, kind),
            code,
        });
        return false;
    }
}
function mountWorkspaceMemoryRememberRoutesAt(app, basePath, mutate, resolveRouteDeps) {
    app.post(`${basePath}/remember`, mutate({ strict: true }), async (req, res) => {
        const deps = resolveRouteDeps(req, res, {
            creating: true,
            kind: 'remember',
        });
        if (!deps)
            return;
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        if (!requireTrustedWorkspace(deps, res))
            return;
        const body = deps.safeBody(req);
        const content = body['content'];
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        if (!trimmedContent) {
            res.status(400).json({
                error: '`content` must be a non-empty string',
                code: 'invalid_content',
            });
            return;
        }
        if (Buffer.byteLength(trimmedContent, 'utf8') > MAX_REMEMBER_CONTENT_BYTES) {
            res.status(400).json({
                error: `\`content\` exceeds the ${MAX_REMEMBER_CONTENT_BYTES}-byte limit`,
                code: 'invalid_content',
            });
            return;
        }
        const contextModeRaw = body['contextMode'] ?? 'workspace';
        if (contextModeRaw !== 'workspace' && contextModeRaw !== 'clean') {
            res.status(400).json({
                error: '`contextMode` must be "workspace", "clean", or omitted',
                code: 'invalid_context_mode',
            });
            return;
        }
        const originatorClientId = validateOriginatorClientId(deps, req, res);
        if (originatorClientId === null)
            return;
        if (!(await validateManagedMemoryAvailable(deps, res, 'remember', assertGenerationOpen))) {
            return;
        }
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        let task;
        try {
            task = deps.lane.enqueue({
                content: trimmedContent,
                contextMode: contextModeRaw,
                ...(originatorClientId ? { originatorClientId } : {}),
                ...(assertGenerationOpen ? { assertGenerationOpen } : {}),
            });
        }
        catch (err) {
            const code = workspaceMemoryFailureCode(err, 'remember_failed', logWorkspaceMemoryExtractionError);
            res.status(publicErrorStatus(code)).json({
                error: publicErrorMessage(code, 'remember'),
                code,
            });
            return;
        }
        res.status(202).json(task);
    });
    app.get(`${basePath}/remember/:taskId`, mutate({ strict: true }), (req, res) => {
        const deps = resolveRouteDeps(req, res, {
            creating: false,
            kind: 'remember',
        });
        if (!deps)
            return;
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        if (!requireTrustedWorkspace(deps, res))
            return;
        const requesterClientId = validateOriginatorClientId(deps, req, res);
        if (requesterClientId === null)
            return;
        const task = deps.lane.get(req.params['taskId'], requesterClientId, 'remember');
        if (!task) {
            res.status(404).json({
                error: 'Workspace memory remember task not found',
                code: 'remember_task_not_found',
            });
            return;
        }
        res.status(200).json(task);
    });
    app.post(`${basePath}/forget`, mutate({ strict: true }), async (req, res) => {
        const deps = resolveRouteDeps(req, res, {
            creating: true,
            kind: 'forget',
        });
        if (!deps)
            return;
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        if (!requireTrustedWorkspace(deps, res))
            return;
        const body = deps.safeBody(req);
        const query = body['query'];
        const trimmedQuery = typeof query === 'string' ? query.trim() : '';
        if (!trimmedQuery) {
            res.status(400).json({
                error: '`query` must be a non-empty string',
                code: 'invalid_query',
            });
            return;
        }
        if (Buffer.byteLength(trimmedQuery, 'utf8') > MAX_REMEMBER_CONTENT_BYTES) {
            res.status(400).json({
                error: `\`query\` exceeds the ${MAX_REMEMBER_CONTENT_BYTES}-byte limit`,
                code: 'invalid_query',
            });
            return;
        }
        const originatorClientId = validateOriginatorClientId(deps, req, res);
        if (originatorClientId === null)
            return;
        if (!(await validateManagedMemoryAvailable(deps, res, 'forget', assertGenerationOpen)))
            return;
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        try {
            const task = deps.lane.enqueueForget({
                query: trimmedQuery,
                ...(originatorClientId ? { originatorClientId } : {}),
                ...(assertGenerationOpen ? { assertGenerationOpen } : {}),
            });
            res.status(202).json(task);
        }
        catch (err) {
            const code = workspaceMemoryFailureCode(err, 'forget_failed', logWorkspaceMemoryExtractionError);
            res.status(publicErrorStatus(code)).json({
                error: publicErrorMessage(code, 'forget'),
                code,
            });
        }
    });
    app.get(`${basePath}/forget/:taskId`, mutate({ strict: true }), (req, res) => {
        const deps = resolveRouteDeps(req, res, {
            creating: false,
            kind: 'forget',
        });
        if (!deps)
            return;
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        if (!requireTrustedWorkspace(deps, res))
            return;
        const requesterClientId = validateOriginatorClientId(deps, req, res);
        if (requesterClientId === null)
            return;
        const task = deps.lane.get(req.params['taskId'], requesterClientId, 'forget');
        if (!task) {
            res.status(404).json({
                error: 'Workspace memory forget task not found',
                code: 'forget_task_not_found',
            });
            return;
        }
        res.status(200).json(task);
    });
    app.post(`${basePath}/dream`, mutate({ strict: true }), async (req, res) => {
        const deps = resolveRouteDeps(req, res, {
            creating: true,
            kind: 'dream',
        });
        if (!deps)
            return;
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        if (!requireTrustedWorkspace(deps, res))
            return;
        const originatorClientId = validateOriginatorClientId(deps, req, res);
        if (originatorClientId === null)
            return;
        if (!(await validateManagedMemoryAvailable(deps, res, 'dream', assertGenerationOpen)))
            return;
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        try {
            const task = deps.lane.enqueueDream({
                ...(originatorClientId ? { originatorClientId } : {}),
                ...(assertGenerationOpen ? { assertGenerationOpen } : {}),
            });
            res.status(202).json(task);
        }
        catch (err) {
            const code = workspaceMemoryFailureCode(err, 'dream_failed', logWorkspaceMemoryExtractionError);
            res.status(publicErrorStatus(code)).json({
                error: publicErrorMessage(code, 'dream'),
                code,
            });
        }
    });
    app.get(`${basePath}/dream/:taskId`, mutate({ strict: true }), (req, res) => {
        const deps = resolveRouteDeps(req, res, {
            creating: false,
            kind: 'dream',
        });
        if (!deps)
            return;
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        if (!requireOpenGeneration(assertGenerationOpen, res))
            return;
        if (!requireTrustedWorkspace(deps, res))
            return;
        const requesterClientId = validateOriginatorClientId(deps, req, res);
        if (requesterClientId === null)
            return;
        const task = deps.lane.get(req.params['taskId'], requesterClientId, 'dream');
        if (!task) {
            res.status(404).json({
                error: 'Workspace memory dream task not found',
                code: 'dream_task_not_found',
            });
            return;
        }
        res.status(200).json(task);
    });
}
export function mountWorkspaceMemoryRememberRoutes(app, deps) {
    mountWorkspaceMemoryRememberRoutesAt(app, '/workspace/memory', deps.mutate, () => deps);
}
export function mountWorkspaceQualifiedMemoryRememberRoutes(app, deps) {
    mountWorkspaceMemoryRememberRoutesAt(app, '/workspaces/:workspace/memory', deps.mutate, deps.resolveRouteDeps);
}
//# sourceMappingURL=workspace-remember.js.map