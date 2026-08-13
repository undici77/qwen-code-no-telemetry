/* eslint-disable import/no-internal-modules */
/**
 * Qwen Code Backend (ACP SDK Client)
 *
 * Spawns Qwen Code in ACP mode and adapts ACP session updates into Craft's
 * provider-agnostic AgentEvent stream.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir, platform, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { ClientSideConnection, PROTOCOL_VERSION, ndJsonStream, } from '@agentclientprotocol/sdk';
import { utf16IndexToByteOffset } from '@craft-agent/core/utils';
import { getProxyEnvVars } from '../config/proxy-env.ts';
import { getCoAuthorPreference } from '../config/preferences.ts';
import { getSessionPlansPath } from '../sessions/storage.ts';
import { getSystemPrompt } from '../prompts/system.ts';
import { resolveFileMentions, resolveSourceMentions, } from '../mentions/index.ts';
import { isParentTaskTool } from '../utils/toolNames.ts';
import { BaseAgent } from './base-agent.ts';
import { AbortReason } from './backend/types.ts';
import { getBackendRuntime } from './backend/internal/driver-types.ts';
import { withElectronRunAsNodeEnv } from './backend/internal/electron-run-as-node.ts';
import { resolveBackendRuntimePaths } from './backend/internal/runtime-resolver.ts';
import { EventQueue } from './backend/event-queue.ts';
import { LLM_QUERY_TIMEOUT_MS, } from './llm-tool.ts';
import { normalizeQwenMemorySettings } from '../config/qwen-settings.ts';
const QWEN_RESPONSE_INTERRUPTED_MESSAGE = 'Response interrupted';
const QWEN_TOOL_RESULT_MISSING_MESSAGE = 'Tool result was not recorded.';
const MAX_MID_TURN_CONTENT_BUILD_FAILURES = 3;
const MID_TURN_ATTACHMENT_PROCESSING_FAILURE_TEXT = '[Attachment could not be processed]';
const SESSION_WRITER_ERROR_KINDS = new Set([
    'session_writer_conflict',
    'session_writer_lost',
    'session_transcript_changed',
    'session_writer_unavailable',
]);
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    if (error &&
        typeof error === 'object' &&
        typeof error.message === 'string') {
        return error.message;
    }
    return String(error);
}
function getAcpErrorDetail(data) {
    if (data == null)
        return undefined;
    if (typeof data === 'string')
        return data.trim() || undefined;
    if (typeof data !== 'object')
        return String(data);
    const record = data;
    for (const key of ['details', 'message', 'error_description']) {
        const value = record[key];
        if (typeof value === 'string' && value.trim())
            return value.trim();
    }
    const nested = getAcpErrorDetail(record.error);
    if (nested)
        return nested;
    try {
        const serialized = JSON.stringify(data);
        return serialized === '{}' ? undefined : serialized;
    }
    catch {
        return undefined;
    }
}
export function formatQwenAcpErrorMessage(error) {
    const message = getErrorMessage(error);
    const data = error && typeof error === 'object'
        ? error.data
        : undefined;
    const detail = getAcpErrorDetail(data);
    if (!detail || detail === message)
        return message;
    return `${message}: ${detail}`;
}
function isSessionWriterAcpError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const record = error;
    const data = record.data && typeof record.data === 'object'
        ? record.data
        : undefined;
    const errorKind = data?.errorKind ?? record.errorKind;
    return (typeof errorKind === 'string' && SESSION_WRITER_ERROR_KINDS.has(errorKind));
}
const MID_TURN_QUEUE_DRAIN_METHOD = 'craft/drainMidTurnQueue';
const TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD = 'craft/claimTodoStopGuardContinuation';
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_INITIALIZE_TIMEOUT_MS = 120_000;
const PERMISSION_REQUEST_TIMEOUT_MS = 5 * 60_000;
const INCLUDE_CRAFT_CONTEXT_IN_QWEN_PROMPTS = false;
const SHARED_ACP_IDLE_TTL_MS = 5 * 60_000;
const sharedAcpProcesses = new Map();
function stableStringifyRecord(value) {
    return JSON.stringify(Object.keys(value)
        .sort()
        .reduce((acc, key) => {
        const item = value[key];
        if (item !== undefined)
            acc[key] = item;
        return acc;
    }, {}));
}
function buildSharedAcpProcessKey(args) {
    return [
        args.command,
        args.spawnArgs.join('\u0000'),
        args.workspaceRootPath,
        stableStringifyRecord(args.envOverrides ?? {}),
    ].join('\u0001');
}
async function acquireSharedQwenAcpProcess(options, subscriber) {
    let processEntry = sharedAcpProcesses.get(options.key);
    if (!processEntry) {
        processEntry = new SharedQwenAcpProcess(options);
        sharedAcpProcesses.set(options.key, processEntry);
    }
    return processEntry.acquire(subscriber);
}
class SharedQwenAcpProcess {
    options;
    child = null;
    connection = null;
    startPromise = null;
    initialized = false;
    subscribers = new Set();
    sessionOwners = new Map();
    refCount = 0;
    idleTimer;
    stderrBuffer = [];
    stderrBufferBytes = 0;
    commandDescription;
    static STDERR_BUFFER_MAX_BYTES = 8 * 1024;
    constructor(options) {
        this.options = options;
        this.commandDescription = `${options.command} ${options.args.join(' ')}`;
    }
    async acquire(subscriber) {
        this.refCount += 1;
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = undefined;
        }
        this.subscribers.add(subscriber);
        try {
            await this.ensureStarted();
        }
        catch (error) {
            this.releaseSubscriber(subscriber);
            throw error;
        }
        const lease = {
            connection: this.ensureConnection(),
            commandDescription: this.commandDescription,
            recentStderr: () => this.stderrBuffer.join(''),
            isActive: () => this.isActive(),
            registerSession: (sessionId) => {
                this.sessionOwners.set(sessionId, subscriber);
            },
            unregisterSession: (sessionId) => {
                if (this.sessionOwners.get(sessionId) === subscriber) {
                    this.sessionOwners.delete(sessionId);
                }
            },
            release: () => this.releaseSubscriber(subscriber),
        };
        return lease;
    }
    async ensureStarted() {
        if (this.isActive())
            return;
        if (this.startPromise) {
            await this.startPromise;
            return;
        }
        this.startPromise = this.start();
        try {
            await this.startPromise;
        }
        finally {
            this.startPromise = null;
        }
    }
    async start() {
        this.debug(`Spawning shared Qwen ACP process: ${this.commandDescription}`);
        this.stderrBuffer = [];
        this.stderrBufferBytes = 0;
        const child = spawn(this.options.command, this.options.args, {
            cwd: this.options.cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: this.buildEnv(),
            shell: false,
        });
        this.child = child;
        this.initialized = false;
        const connection = new ClientSideConnection(() => this.createAcpClient(), ndJsonStream(Writable.toWeb(child.stdin), Readable.toWeb(child.stdout)));
        this.connection = connection;
        child.stderr?.on('data', (data) => {
            const text = data.toString();
            this.recordStderr(text);
            const trimmed = text.trim();
            if (trimmed)
                this.debug(`[qwen stderr] ${trimmed}`);
        });
        child.on('exit', (code, signal) => this.handleExit(code, signal));
        child.on('error', (error) => {
            this.debug(`Qwen ACP process error: ${error.message}`);
        });
        void connection.closed.then(() => {
            if (this.connection !== connection)
                return;
            if (this.child === child && !child.killed && child.exitCode === null) {
                child.kill();
            }
        });
        try {
            await this.withTimeout(connection.initialize({
                protocolVersion: PROTOCOL_VERSION,
                clientCapabilities: {},
            }), 'initialize', qwenInitializeTimeoutMs());
            this.initialized = true;
        }
        catch (error) {
            this.kill();
            throw error;
        }
    }
    buildEnv() {
        const env = {
            ...process.env,
            ...getProxyEnvVars(),
            ...this.options.envOverrides,
        };
        delete env.CRAFT_SESSION_DIR;
        return withElectronRunAsNodeEnv(env, this.options.command, this.options.args);
    }
    createAcpClient() {
        return {
            requestPermission: async (params) => {
                const sessionId = asString(toRecord(params).sessionId);
                const owner = sessionId ? this.sessionOwners.get(sessionId) : undefined;
                if (owner)
                    return owner.onPermissionRequest(params);
                this.debug(`Qwen permission request had no owner for session ${sessionId ?? 'unknown'}`);
                return { outcome: { outcome: 'cancelled' } };
            },
            sessionUpdate: async (params) => {
                for (const subscriber of [...this.subscribers]) {
                    subscriber.onSessionUpdate(params);
                }
            },
            extMethod: async (method, params) => {
                const record = toRecord(params);
                const sessionId = asString(record.sessionId);
                const owner = sessionId ? this.sessionOwners.get(sessionId) : undefined;
                if (owner)
                    return owner.onExtMethod(method, record);
                if (method === TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD) {
                    return { claimed: false, hasQueuedPrompt: false };
                }
                for (const subscriber of [...this.subscribers]) {
                    const result = await subscriber.onExtMethod(method, record);
                    if (Object.keys(result).length > 0)
                        return result;
                }
                if (method === MID_TURN_QUEUE_DRAIN_METHOD) {
                    return { messages: [], hasQueuedPrompt: false };
                }
                return {};
            },
        };
    }
    ensureConnection() {
        if (!this.connection ||
            this.connection.signal.aborted ||
            !this.isActive()) {
            throw new Error('Qwen ACP process is not running');
        }
        return this.connection;
    }
    isActive() {
        return !!(this.child &&
            !this.child.killed &&
            this.child.exitCode === null &&
            this.connection &&
            !this.connection.signal.aborted &&
            this.initialized);
    }
    releaseSubscriber(subscriber) {
        if (this.subscribers.delete(subscriber)) {
            this.refCount = Math.max(0, this.refCount - 1);
        }
        for (const [sessionId, owner] of [...this.sessionOwners]) {
            if (owner === subscriber)
                this.sessionOwners.delete(sessionId);
        }
        if (this.refCount === 0 && !this.idleTimer) {
            this.idleTimer = setTimeout(() => {
                if (this.refCount > 0)
                    return;
                sharedAcpProcesses.delete(this.options.key);
                this.kill();
            }, SHARED_ACP_IDLE_TTL_MS);
        }
    }
    handleExit(code, signal) {
        this.debug(`Qwen ACP process exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
        this.initialized = false;
        this.child = null;
        this.connection = null;
        sharedAcpProcesses.delete(this.options.key);
        for (const subscriber of [...this.subscribers]) {
            subscriber.onProcessExit(code, signal);
        }
    }
    kill() {
        this.connection = null;
        if (this.child && !this.child.killed) {
            this.child.kill();
        }
        this.child = null;
        this.initialized = false;
    }
    recordStderr(chunk) {
        if (!chunk)
            return;
        const effective = chunk.length > SharedQwenAcpProcess.STDERR_BUFFER_MAX_BYTES
            ? chunk.slice(chunk.length - SharedQwenAcpProcess.STDERR_BUFFER_MAX_BYTES)
            : chunk;
        this.stderrBuffer.push(effective);
        this.stderrBufferBytes += effective.length;
        while (this.stderrBufferBytes > SharedQwenAcpProcess.STDERR_BUFFER_MAX_BYTES &&
            this.stderrBuffer.length > 1) {
            const dropped = this.stderrBuffer.shift();
            this.stderrBufferBytes -= dropped.length;
        }
    }
    withTimeout(promise, method, timeoutMs) {
        if (timeoutMs <= 0)
            return promise;
        let timeout;
        const timeoutPromise = new Promise((_, reject) => {
            timeout = setTimeout(() => {
                reject(new Error(`Qwen ACP request timed out: ${method}`));
            }, timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => {
            if (timeout)
                clearTimeout(timeout);
        });
    }
    debug(message) {
        for (const subscriber of [...this.subscribers]) {
            subscriber.onDebug(message);
        }
    }
}
function buildQwenAcpSpawnCommand(qwenCliPath, nodePath) {
    const args = ['--acp', '--channel=desktop'];
    if (qwenCliPath.endsWith('.js')) {
        return { command: nodePath, args: [qwenCliPath, ...args] };
    }
    return { command: qwenCliPath, args };
}
function qwenSettingsCwd(hostRuntime) {
    return hostRuntime.appRootPath || homedir() || process.cwd();
}
function qwenAcpWithTimeout(promise, method, timeoutMs) {
    if (timeoutMs <= 0)
        return promise;
    let timeout;
    const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => {
            reject(new Error(`Qwen ACP request timed out: ${method}`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timeout)
            clearTimeout(timeout);
    });
}
async function callQwenSettingsAcpMethod(options, method, params = {}) {
    const resolvedPaths = resolveBackendRuntimePaths(options.hostRuntime);
    const qwenCliPath = resolvedPaths.qwenCliPath;
    if (!qwenCliPath) {
        throw new Error('Qwen Code CLI not found. Build the current qwen-code checkout with npm run build && npm run bundle, or set QWEN_CODE_CLI to a dist/cli.js path.');
    }
    const nodePath = resolvedPaths.nodeRuntimePath || process.execPath;
    const { command, args } = buildQwenAcpSpawnCommand(qwenCliPath, nodePath);
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const processCwd = options.processCwd || cwd;
    const key = buildSharedAcpProcessKey({
        command,
        spawnArgs: args,
        workspaceRootPath: processCwd,
        envOverrides: options.envOverrides,
    });
    const lease = await acquireSharedQwenAcpProcess({
        key,
        command,
        args,
        cwd: processCwd,
        envOverrides: options.envOverrides,
    }, {
        onSessionUpdate: () => { },
        onPermissionRequest: async () => ({ outcome: { outcome: 'cancelled' } }),
        onExtMethod: async (extMethod) => {
            if (extMethod === MID_TURN_QUEUE_DRAIN_METHOD) {
                return { messages: [], hasQueuedPrompt: false };
            }
            if (extMethod === TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD) {
                return { claimed: false, hasQueuedPrompt: false };
            }
            return {};
        },
        onProcessExit: () => { },
        onDebug: options.debug ?? (() => { }),
    });
    try {
        return toRecord(await qwenAcpWithTimeout(lease.connection.extMethod(method, params), method, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS));
    }
    finally {
        lease.release();
    }
}
export async function getQwenMemorySettingsViaAcp(options) {
    const response = await callQwenSettingsAcpMethod(options, 'qwen/settings/getMemory');
    return normalizeQwenMemorySettings(response.settings);
}
export async function setQwenMemorySettingsViaAcp(options, updates) {
    const response = await callQwenSettingsAcpMethod(options, 'qwen/settings/setMemory', { updates });
    return normalizeQwenMemorySettings(response.settings);
}
export async function getQwenSettingsPathViaAcp(options) {
    const response = await callQwenSettingsAcpMethod(options, 'qwen/settings/getPath');
    const settingsPath = asString(response.path);
    if (!settingsPath)
        throw new Error('Qwen ACP did not return settings path');
    return settingsPath;
}
export async function getQwenCoreSettingsViaAcp(options) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/getCore', { cwd });
    return response;
}
export async function setQwenCoreSettingViaAcp(options, scope, key, value) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/setCoreValue', { cwd, scope, key, value });
    return response;
}
export async function setQwenMcpServerViaAcp(options, scope, name, server) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/setMcpServer', { cwd, scope, name, server });
    return response;
}
export async function removeQwenMcpServerViaAcp(options, scope, name) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/removeMcpServer', { cwd, scope, name });
    return response;
}
export async function setQwenHookViaAcp(options, scope, event, index, hook) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/setHook', { cwd, scope, event, index, hook });
    return response;
}
export async function removeQwenHookViaAcp(options, scope, event, index) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/removeHook', { cwd, scope, event, index });
    return response;
}
export async function setQwenExtensionSettingViaAcp(options, extensionId, settingKey, scope, value) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/setExtensionSetting', { cwd, extensionId, settingKey, scope, value });
    return response;
}
export async function getQwenPermissionSettingsViaAcp(options) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/permissions/getSettings', { cwd });
    return response;
}
export async function setQwenPermissionRulesViaAcp(options, scope, ruleType, rules) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/permissions/setRules', { cwd, scope, ruleType, rules });
    return response;
}
export async function getQwenMemoryPathsViaAcp(options) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/settings/getMemoryPaths', { cwd, projectRoot: options.projectRoot ?? cwd });
    const paths = toRecord(response.paths);
    const userMemoryFile = asString(paths.userMemoryFile);
    const projectMemoryFile = asString(paths.projectMemoryFile);
    const autoMemoryDir = asString(paths.autoMemoryDir);
    if (!userMemoryFile || !projectMemoryFile || !autoMemoryDir) {
        throw new Error('Qwen ACP did not return memory paths');
    }
    return { userMemoryFile, projectMemoryFile, autoMemoryDir };
}
export async function listQwenProvidersViaAcp(options) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/providers/list', { cwd });
    return normalizeQwenProviderCatalog(response);
}
export async function getQwenWorkspacePreflightViaAcp(options) {
    return callQwenSettingsAcpMethod(options, 'qwen/status/workspace/preflight');
}
export async function fetchQwenModelsViaSharedAcp(options) {
    const response = await callQwenSettingsAcpMethod(options, 'qwen/status/workspace/providers');
    const current = toRecord(response.current);
    let serverDefault = asString(current.modelId);
    const providers = Array.isArray(response.providers)
        ? response.providers.filter(isRecord)
        : [];
    const models = [];
    const seen = new Set();
    for (const provider of providers) {
        const providerModels = Array.isArray(provider.models)
            ? provider.models
            : [];
        for (const value of providerModels) {
            const model = toQwenModelDefinition(value);
            if (!model || seen.has(model.id))
                continue;
            seen.add(model.id);
            models.push(model);
            if (!serverDefault && toRecord(value).isCurrent === true) {
                serverDefault = model.id;
            }
        }
    }
    if (models.length === 0) {
        throw new Error('Qwen ACP workspace providers did not return models');
    }
    return { models, serverDefault };
}
function normalizeQwenProviderCatalog(response) {
    return {
        providers: Array.isArray(response.providers)
            ? response.providers
            : [],
    };
}
export async function connectQwenProviderViaAcp(options, params) {
    const cwd = options.cwd || qwenSettingsCwd(options.hostRuntime);
    const response = await callQwenSettingsAcpMethod({ ...options, cwd }, 'qwen/providers/connect', { cwd, ...params });
    return normalizeQwenProviderConnectResult(response);
}
function normalizeQwenProviderConnectResult(response) {
    const error = asString(response.error);
    const providerId = asString(response.providerId);
    const providerLabel = asString(response.providerLabel);
    const authType = asString(response.authType);
    const modelId = asString(response.modelId);
    return {
        success: response.success === true,
        ...(error ? { error } : {}),
        ...(providerId ? { providerId } : {}),
        ...(providerLabel ? { providerLabel } : {}),
        ...(authType ? { authType } : {}),
        ...(modelId ? { modelId } : {}),
    };
}
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function asString(value) {
    return typeof value === 'string' ? value : undefined;
}
// Keep these in sync with USER_PROMPT_SUBMIT_CONTEXT_OPEN/CLOSE in Qwen core.
const QWEN_USER_PROMPT_CONTEXT_OPEN = '<qwen:user-prompt-submit-context>';
const QWEN_USER_PROMPT_CONTEXT_CLOSE = '</qwen:user-prompt-submit-context>';
function isQwenUserPromptContextPart(part) {
    if (!isRecord(part) || typeof part.text !== 'string')
        return false;
    const text = part.text.trim();
    const prefix = `${QWEN_USER_PROMPT_CONTEXT_OPEN}\n`;
    const suffix = `\n${QWEN_USER_PROMPT_CONTEXT_CLOSE}`;
    if (!text.startsWith(prefix) || !text.endsWith(suffix)) {
        return false;
    }
    const body = text.slice(prefix.length, -suffix.length);
    return (!body.includes(QWEN_USER_PROMPT_CONTEXT_OPEN) &&
        !body.includes(QWEN_USER_PROMPT_CONTEXT_CLOSE));
}
function projectQwenUserRecordText(record) {
    const message = toRecord(record.message);
    const parts = Array.isArray(message.parts)
        ? message.parts.filter(isRecord)
        : [];
    const hasFinalHookContextPart = parts.length > 1 &&
        isQwenUserPromptContextPart(parts[parts.length - 1]);
    const payload = isRecord(record.systemPayload)
        ? record.systemPayload
        : undefined;
    const displayText = payload &&
        (asString(payload.hookContext) !== undefined || hasFinalHookContextPart)
        ? asString(payload.displayText)
        : undefined;
    if (displayText !== undefined)
        return displayText;
    const visibleParts = payload === undefined && hasFinalHookContextPart
        ? parts.slice(0, -1)
        : parts;
    return visibleParts
        .map((part) => asString(part.text))
        .filter((text) => !!text)
        .join('\n\n');
}
export function extractQwenParentToolUseId(update) {
    const meta = toRecord(update._meta);
    return (asString(update.parentToolCallId) ||
        asString(update.parentToolUseId) ||
        asString(update.parent_tool_use_id) ||
        asString(meta.parentToolCallId) ||
        asString(meta.parentToolUseId) ||
        asString(meta.parent_tool_use_id));
}
export function resolveQwenParentToolUseId(args) {
    const explicitParentToolUseId = extractQwenParentToolUseId(args.update);
    if (explicitParentToolUseId && explicitParentToolUseId !== args.toolUseId) {
        return explicitParentToolUseId;
    }
    const activeParentToolUseIds = args.activeParentToolUseIds;
    if (activeParentToolUseIds?.size === 1) {
        const [activeParentToolUseId] = activeParentToolUseIds;
        if (activeParentToolUseId !== args.toolUseId) {
            return activeParentToolUseId;
        }
    }
    return undefined;
}
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0)
        return value;
    if (typeof value !== 'string')
        return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
function asBoolean(value) {
    return typeof value === 'boolean' ? value : undefined;
}
function parseAskUserQuestions(value) {
    if (!Array.isArray(value))
        return undefined;
    const questions = value
        .filter(isRecord)
        .map((question) => {
        const options = Array.isArray(question.options)
            ? question.options
                .filter(isRecord)
                .map((option) => ({
                label: asString(option.label) || '',
                description: asString(option.description) || '',
            }))
                .filter((option) => option.label)
            : [];
        return {
            question: asString(question.question) || '',
            header: asString(question.header) || '',
            options,
            ...(asBoolean(question.multiSelect) !== undefined
                ? { multiSelect: asBoolean(question.multiSelect) }
                : {}),
        };
    })
        .filter((question) => question.question && question.header && question.options.length > 0);
    return questions.length > 0 ? questions : undefined;
}
function firstNumber(...values) {
    for (const value of values) {
        const number = asNumber(value);
        if (number !== undefined)
            return number;
    }
    return undefined;
}
function firstBoolean(...values) {
    for (const value of values) {
        const bool = asBoolean(value);
        if (bool !== undefined)
            return bool;
    }
    return undefined;
}
function firstRecord(...values) {
    for (const value of values) {
        const record = toRecord(value);
        if (Object.keys(record).length > 0)
            return record;
    }
    return {};
}
function toQwenModelDefinition(value) {
    const model = toRecord(value);
    const id = asString(model.modelId);
    if (!id)
        return null;
    const name = asString(model.name) || id;
    const meta = toRecord(model._meta);
    const generationConfig = toRecord(model.generationConfig);
    const metaGenerationConfig = toRecord(meta.generationConfig);
    const extraBody = toRecord(generationConfig.extra_body);
    const metaExtraBody = toRecord(metaGenerationConfig.extra_body);
    const capabilities = toRecord(model.capabilities);
    const limits = toRecord(capabilities.limits);
    const metaCapabilities = toRecord(meta.capabilities);
    const metaLimits = toRecord(metaCapabilities.limits);
    const contextWindow = firstNumber(meta.contextLimit, meta.contextWindowSize, meta.contextWindow, model.contextLimit, model.contextWindowSize, model.contextWindow, model.maxContextWindowTokens, metaGenerationConfig.contextWindowSize, metaGenerationConfig.contextWindow, generationConfig.contextWindowSize, generationConfig.contextWindow, metaLimits.max_context_window_tokens, limits.max_context_window_tokens);
    const supportsThinking = firstBoolean(meta.supportsThinking, meta.supportsReasoning, meta.enableThinking, meta.enable_thinking, model.supportsThinking, model.supportsReasoning, model.enableThinking, model.enable_thinking, metaGenerationConfig.enableThinking, metaGenerationConfig.enable_thinking, metaExtraBody.enableThinking, metaExtraBody.enable_thinking, generationConfig.enableThinking, generationConfig.enable_thinking, extraBody.enableThinking, extraBody.enable_thinking);
    return {
        id,
        name,
        shortName: name,
        description: asString(model.description) || '',
        provider: 'qwen',
        ...(contextWindow !== undefined ? { contextWindow } : {}),
        ...(supportsThinking !== undefined ? { supportsThinking } : {}),
    };
}
function toRecord(value) {
    return isRecord(value) ? value : {};
}
function toAvailableSlashCommands(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    const commands = [];
    for (const item of value) {
        const record = toRecord(item);
        const rawName = asString(record.name)?.trim().replace(/^\/+/, '');
        if (!rawName || seen.has(rawName))
            continue;
        seen.add(rawName);
        const input = record.input === null || isRecord(record.input)
            ? record.input
            : undefined;
        commands.push({
            name: rawName,
            description: asString(record.description),
            ...(input !== undefined && { input }),
        });
    }
    return commands;
}
function toAvailableSkills(value) {
    if (!Array.isArray(value))
        return undefined;
    const seen = new Set();
    const skills = [];
    for (const item of value) {
        const name = asString(item)?.trim().replace(/^\/+/, '');
        if (!name || seen.has(name))
            continue;
        seen.add(name);
        skills.push(name);
    }
    return skills.length > 0 ? skills : undefined;
}
function toAvailableSkillDetails(value) {
    if (!Array.isArray(value))
        return undefined;
    const seen = new Set();
    const details = [];
    for (const item of value) {
        const record = toRecord(item);
        const name = asString(record.name)?.trim().replace(/^\/+/, '');
        if (!name || seen.has(name))
            continue;
        seen.add(name);
        const description = asString(record.description);
        const body = asString(record.body);
        const filePath = asString(record.filePath);
        const level = asString(record.level);
        const modelInvocable = asBoolean(record.modelInvocable);
        details.push({
            name,
            ...(description !== undefined && { description }),
            ...(body !== undefined && { body }),
            ...(filePath !== undefined && { filePath }),
            ...(level !== undefined && { level }),
            ...(modelInvocable !== undefined && { modelInvocable }),
        });
    }
    return details.length > 0 ? details : undefined;
}
function formatDebugNames(values, max = 40) {
    if (!values || values.length === 0)
        return 'none';
    const visible = values.slice(0, max).join(', ');
    return values.length > max
        ? `${visible}, ... +${values.length - max} more`
        : visible;
}
function parseQwenTimestamp(value) {
    const raw = asString(value);
    if (!raw)
        return undefined;
    const timestamp = Date.parse(raw);
    return Number.isFinite(timestamp) ? timestamp : undefined;
}
function sanitizeQwenCwd(cwd) {
    const normalizedCwd = platform() === 'win32' ? cwd.toLowerCase() : cwd;
    return normalizedCwd.replace(/[^a-zA-Z0-9]/g, '-');
}
function resolveQwenRuntimeDir(dir) {
    if (dir === '~')
        return homedir();
    if (dir.startsWith('~/') || dir.startsWith('~\\')) {
        return join(homedir(), ...dir
            .slice(2)
            .split(/[/\\]+/)
            .filter(Boolean));
    }
    return isAbsolute(dir) ? dir : resolve(dir);
}
function getQwenRuntimeDir() {
    const envDir = process.env.QWEN_RUNTIME_DIR;
    if (envDir)
        return resolveQwenRuntimeDir(envDir);
    const homeDir = homedir();
    return homeDir ? join(homeDir, '.qwen') : join(tmpdir(), '.qwen');
}
function getQwenTranscriptPath(sessionId, cwd) {
    const projectId = sanitizeQwenCwd(resolve(cwd));
    return join(getQwenRuntimeDir(), 'projects', projectId, 'chats', `${sessionId}.jsonl`);
}
function qwenSkillNameFromTextElement(element) {
    const raw = (element.target ||
        element.label ||
        element.placeholder ||
        '').trim();
    if (!raw)
        return undefined;
    const bracketMatch = /^\[skill:([^\]]+)\]$/.exec(raw);
    const normalized = (bracketMatch?.[1] ?? raw).trim();
    const withoutPlugin = normalized.startsWith('.agents:')
        ? normalized.slice('.agents:'.length).trim()
        : normalized;
    return withoutPlugin.split(':').pop()?.trim() || withoutPlugin;
}
function rangesOverlapBytes(a, b) {
    return (a.byte_range.start < b.byte_range.end &&
        b.byte_range.start < a.byte_range.end);
}
function qwenTranscriptPlaceholderFromSourceElement(sourceElement) {
    if (sourceElement.type === 'skill') {
        const skillName = qwenSkillNameFromTextElement(sourceElement);
        return skillName ? `@${skillName}` : undefined;
    }
    return sourceElement.placeholder || undefined;
}
function findNonOverlappingPlaceholderStart(content, placeholder, elements) {
    let start = content.indexOf(placeholder);
    while (start >= 0) {
        const candidate = {
            type: 'context',
            byte_range: {
                start: utf16IndexToByteOffset(content, start),
                end: utf16IndexToByteOffset(content, start + placeholder.length),
            },
            placeholder,
        };
        if (!elements.some((existing) => rangesOverlapBytes(existing, candidate)))
            return start;
        start = content.indexOf(placeholder, start + placeholder.length);
    }
    return -1;
}
function buildQwenTranscriptTextElements(content, sourceElements) {
    const elements = [];
    for (const sourceElement of sourceElements ?? []) {
        const placeholder = qwenTranscriptPlaceholderFromSourceElement(sourceElement);
        if (!placeholder)
            continue;
        const start = findNonOverlappingPlaceholderStart(content, placeholder, elements);
        if (start < 0)
            continue;
        const element = {
            type: sourceElement.type,
            byte_range: {
                start: utf16IndexToByteOffset(content, start),
                end: utf16IndexToByteOffset(content, start + placeholder.length),
            },
            placeholder,
            ...(sourceElement.label ? { label: sourceElement.label } : {}),
            ...(sourceElement.target ? { target: sourceElement.target } : {}),
            ...(sourceElement.metadata ? { metadata: sourceElement.metadata } : {}),
        };
        if (sourceElement.type === 'skill') {
            const skillName = qwenSkillNameFromTextElement(sourceElement);
            if (skillName) {
                element.target = skillName;
                element.label = sourceElement.label || skillName;
            }
        }
        elements.push(element);
    }
    elements.sort((a, b) => a.byte_range.start - b.byte_range.start);
    return elements.length > 0 ? elements : undefined;
}
function toQwenTranscriptTextElements(value) {
    if (!Array.isArray(value))
        return undefined;
    const byteOffset = (offset) => {
        if (typeof offset === 'number' && Number.isFinite(offset) && offset >= 0)
            return offset;
        if (typeof offset !== 'string')
            return undefined;
        const parsed = Number(offset);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
    };
    const elements = value
        .filter(isRecord)
        .map((element) => {
        const type = asString(element.type);
        const byteRange = toRecord(element.byte_range);
        const start = byteOffset(byteRange.start);
        const end = byteOffset(byteRange.end);
        const placeholder = asString(element.placeholder);
        if (!type || start == null || end == null || !placeholder)
            return null;
        if (![
            'source',
            'skill',
            'context',
            'slash_command',
            'file',
            'folder',
        ].includes(type))
            return null;
        return {
            type,
            byte_range: { start, end },
            placeholder,
            ...(asString(element.label) ? { label: asString(element.label) } : {}),
            ...(asString(element.target)
                ? { target: asString(element.target) }
                : {}),
            ...(isRecord(element.metadata) ? { metadata: element.metadata } : {}),
        };
    })
        .filter((element) => !!element);
    return elements.length > 0 ? elements : undefined;
}
function jsonStringify(value) {
    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return String(value);
    }
}
function isQwenUserInterruptText(value) {
    if (!value)
        return false;
    const text = value.toLowerCase();
    return (text.includes('request was aborted') ||
        text.includes('apiuseraborterror') ||
        text.includes('cancelled by user') ||
        text.includes('canceled by user') ||
        text.includes('user abort'));
}
function isQwenUserInterruptStatus(value) {
    return (value === 'cancelled' ||
        value === 'canceled' ||
        isQwenUserInterruptText(value));
}
function isQwenToolFailureStatus(status) {
    return status === 'failed' || status === 'error';
}
function firstStringValue(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value)
            return value;
    }
    return undefined;
}
function qwenFunctionResponseText(response) {
    const direct = firstStringValue(response.output, response.content, response.error, response.result);
    if (direct)
        return direct;
    return Object.keys(response).length > 0 ? jsonStringify(response) : undefined;
}
function parseJsonText(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    try {
        return JSON.parse(trimmed);
    }
    catch {
        return null;
    }
}
function isJsonCodeFence(value) {
    return /^```(?:json|JSON)?\s*\r?\n/.test(value.trim());
}
function isDoctorOutput(value) {
    const record = toRecord(value);
    return Array.isArray(record.checks) && isRecord(record.summary);
}
function formatJsonMarkdown(value) {
    return `\`\`\`json\n${jsonStringify(value)}\n\`\`\``;
}
function normalizeQwenAssistantText(text, options = {}) {
    const trimmed = text.trim();
    if (!trimmed || isJsonCodeFence(trimmed))
        return text;
    if (!trimmed.startsWith('{') && !trimmed.startsWith('['))
        return text;
    const parsed = parseJsonText(text);
    if (!parsed)
        return text;
    if (!options.forceJsonFence && !isDoctorOutput(parsed))
        return text;
    return formatJsonMarkdown(parsed);
}
function formatQwenSlashOutputHistoryItem(item) {
    const text = asString(item.text);
    if (text?.trim()) {
        return normalizeQwenAssistantText(text, { forceJsonFence: true });
    }
    if (item.type === 'doctor') {
        return formatJsonMarkdown({
            checks: Array.isArray(item.checks) ? item.checks : [],
            summary: toRecord(item.summary),
        });
    }
    return undefined;
}
function isSlashCommandPrompt(message, attachments) {
    if (attachments && attachments.length > 0)
        return false;
    return /^\/[A-Za-z][\w-]*(?:\s|$)/.test(message.trim());
}
function qwenInitializeTimeoutMs() {
    const raw = process.env.QWEN_ACP_INITIALIZE_TIMEOUT_MS ||
        process.env.QWEN_INITIALIZE_TIMEOUT_MS;
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_INITIALIZE_TIMEOUT_MS;
}
function mapPermissionModeToQwen(mode) {
    switch (mode) {
        case 'allow-all':
            return 'yolo';
        case 'safe':
            return 'plan';
        case 'auto-edit':
            return 'auto-edit';
        case 'ask':
        default:
            return 'default';
    }
}
function mapQwenModeToPermissionMode(mode) {
    switch (mode) {
        case 'plan':
            return 'safe';
        case 'yolo':
            return 'allow-all';
        case 'auto-edit':
            return 'auto-edit';
        case 'default':
            return 'ask';
        default:
            return undefined;
    }
}
function mapPlanStatus(status) {
    switch (status) {
        case 'completed':
        case 'complete':
        case 'done':
            return 'completed';
        case 'in_progress':
        case 'in-progress':
        case 'running':
            return 'in_progress';
        default:
            return 'pending';
    }
}
function normalizeToolName(toolName, kind) {
    const raw = (toolName || kind || 'tool').trim();
    const lower = raw.toLowerCase();
    const mappings = {
        read_file: 'Read',
        read_many_files: 'Read',
        write_file: 'Write',
        edit: 'Edit',
        replace: 'Edit',
        list_directory: 'LS',
        glob: 'Glob',
        file_search: 'Glob',
        search_file_content: 'Grep',
        grep: 'Grep',
        content_search: 'Grep',
        run_shell_command: 'Bash',
        shell: 'Bash',
        web_fetch: 'WebFetch',
        todo_write: 'TodoWrite',
        exit_plan_mode: 'ExitPlanMode',
    };
    if (mappings[lower])
        return mappings[lower];
    switch (kind) {
        case 'read':
            return 'Read';
        case 'edit':
        case 'delete':
        case 'move':
            return 'Edit';
        case 'search':
            return 'Grep';
        case 'execute':
            return 'Bash';
        case 'fetch':
            return 'WebFetch';
        case 'switch_mode':
            return 'ExitPlanMode';
        default:
            return raw;
    }
}
function displayNameForTool(toolName, kind) {
    if (toolName === 'Bash')
        return 'Run Command';
    if (toolName === 'Read')
        return 'Read File';
    if (toolName === 'Write')
        return 'Write File';
    if (toolName === 'Edit')
        return 'Edit File';
    if (toolName === 'LS')
        return 'List Directory';
    if (toolName === 'Glob')
        return 'Search Files';
    if (toolName === 'Grep')
        return 'Search Content';
    if (toolName === 'WebFetch')
        return 'Fetch URL';
    if (toolName === 'ExitPlanMode')
        return 'Switch Mode';
    if (kind === 'think')
        return 'Think';
    return toolName;
}
function permissionTypeForKind(kind) {
    switch (kind) {
        case 'execute':
            return 'bash';
        case 'edit':
        case 'delete':
        case 'move':
            return 'file_write';
        case 'fetch':
            return 'api_mutation';
        case 'switch_mode':
            return 'admin_approval';
        default:
            return 'mcp_mutation';
    }
}
export class QwenAgent extends BaseAgent {
    backendName = 'Qwen Code';
    acpLease = null;
    connection = null;
    qwenSessionId = null;
    ensureQwenSessionPromise = null;
    eventQueue = new EventQueue();
    _isProcessing = false;
    abortReason;
    persistedQwenSessionId = null;
    qwenPersistenceCwd = null;
    activePromptRunId = null;
    promptRunCounter = 0;
    permissionRequestCounter = 0;
    toolIdCounter = 0;
    planUpdateCounter = 0;
    hasInitialModeOverride = false;
    pendingModeOverride = null;
    pendingPermissions = new Map();
    miniCollectors = new Map();
    historyCollectors = new Map();
    ensureProcessPromise = null;
    suppressedSessionUpdates = new Set();
    pendingAvailableCommandsUpdates = new Map();
    latestAvailableCommandsSnapshot = null;
    availableCommandsWaiters = [];
    availableModelIds = null;
    availableModelsById = new Map();
    firstAvailableModelId;
    sourceMcpServers = {};
    currentTurnId;
    currentAssistantText = '';
    currentThoughtText = '';
    currentAssistantParentToolUseId;
    currentThoughtParentToolUseId;
    currentIsSlashCommand = false;
    capturedUsageInCurrentTurn = false;
    usageWaiters = [];
    toolNames = new Map();
    toolInputs = new Map();
    activeParentToolUseIds = new Set();
    midTurnMessageQueue = [];
    constructor(config) {
        super(config, config.model || '');
        this._supportsBranching = false;
        this.persistedQwenSessionId = config.session?.sdkSessionId || null;
        this.qwenPersistenceCwd = this.persistedQwenSessionId
            ? this.resolvedCwd()
            : null;
        this.pendingModeOverride =
            config.session?.permissionMode && !config.session?.sdkSessionId
                ? config.session.permissionMode
                : null;
        this.hasInitialModeOverride = this.pendingModeOverride !== null;
        if (!config.isHeadless) {
            this.startConfigWatcher();
        }
    }
    getRecentStderr() {
        return this.acpLease?.recentStderr() ?? '';
    }
    getSessionId() {
        return (this.qwenSessionId ??
            this.persistedQwenSessionId ??
            this.config.session?.sdkSessionId ??
            null);
    }
    setSessionId(sessionId) {
        const previousSessionId = this.qwenSessionId ?? this.persistedQwenSessionId;
        super.setSessionId(sessionId);
        if (this.qwenSessionId)
            this.unregisterAcpSession(this.qwenSessionId);
        this.qwenSessionId = sessionId;
        this.persistedQwenSessionId = sessionId;
        this.qwenPersistenceCwd = sessionId
            ? sessionId === previousSessionId
                ? (this.qwenPersistenceCwd ?? this.resolvedCwd())
                : this.resolvedCwd()
            : null;
        if (sessionId)
            this.registerAcpSession(sessionId);
    }
    clearHistory() {
        super.clearHistory();
        if (this.qwenSessionId)
            this.unregisterAcpSession(this.qwenSessionId);
        this.qwenSessionId = null;
        this.persistedQwenSessionId = null;
        this.qwenPersistenceCwd = null;
        this.pendingAvailableCommandsUpdates.clear();
        this.latestAvailableCommandsSnapshot = null;
        this.resolveAvailableCommandsWaiters(null);
        this.config.onSdkSessionIdCleared?.();
    }
    extractSkillPaths(message) {
        const withQwenSkills = message.replace(/\[skill:([^\]]+)\]/g, (_match, rawSkill) => {
            const normalized = rawSkill.trim();
            const skillName = normalized.startsWith('.agents:')
                ? normalized.slice('.agents:'.length).trim()
                : normalized;
            return skillName ? `@${skillName}` : '';
        });
        const withSources = resolveSourceMentions(withQwenSkills);
        const workDir = this.config.session?.workingDirectory ?? this.workingDirectory;
        const cleanMessage = resolveFileMentions(withSources, workDir).trim();
        if (withQwenSkills !== message) {
            this.debug('[extractSkillPaths] Qwen skill mentions are passed to ACP as @skill references');
        }
        return {
            skillPaths: new Map(),
            cleanMessage: cleanMessage || message.trim(),
            missingSkills: [],
        };
    }
    updateWorkingDirectory(path) {
        super.updateWorkingDirectory(path);
        if (this.qwenSessionId) {
            this.unregisterAcpSession(this.qwenSessionId);
            this.qwenSessionId = null;
            this.persistedQwenSessionId = null;
            this.qwenPersistenceCwd = null;
            this.pendingAvailableCommandsUpdates.clear();
            this.latestAvailableCommandsSnapshot = null;
            this.resolveAvailableCommandsWaiters(null);
            this.config.onSdkSessionIdCleared?.();
            this.debug('Qwen ACP session cleared after working directory change');
        }
    }
    invalidateAvailableCommandsSnapshot(reason) {
        if (this.latestAvailableCommandsSnapshot) {
            this.debug(`Qwen slash command snapshot invalidated: ${reason}`);
        }
        this.latestAvailableCommandsSnapshot = null;
    }
    async *chatImpl(messageParam, attachments, options) {
        let message = messageParam;
        const promptRunId = ++this.promptRunCounter;
        this.activePromptRunId = promptRunId;
        this._isProcessing = true;
        this.abortReason = undefined;
        this.eventQueue.reset();
        this.currentAssistantText = '';
        this.currentThoughtText = '';
        this.currentAssistantParentToolUseId = undefined;
        this.currentThoughtParentToolUseId = undefined;
        this.currentIsSlashCommand = isSlashCommandPrompt(message, attachments);
        this.capturedUsageInCurrentTurn = false;
        this.currentTurnId = `qwen-turn-${promptRunId}`;
        this.toolNames.clear();
        this.toolInputs.clear();
        this.activeParentToolUseIds.clear();
        this.midTurnMessageQueue = [];
        this.emitAutomationEvent('UserPromptSubmit', {
            hook_event_name: 'UserPromptSubmit',
            prompt: message,
        });
        try {
            await this.ensureProcess();
            try {
                await this.ensureQwenSession();
            }
            catch (error) {
                if (isSessionWriterAcpError(error))
                    throw error;
                if (this.persistedQwenSessionId || this.config.session?.sdkSessionId) {
                    this.debug(`Qwen resume failed, starting a fresh session: ${error instanceof Error ? error.message : String(error)}`);
                    this.qwenSessionId = null;
                    this.persistedQwenSessionId = null;
                    this.qwenPersistenceCwd = null;
                    this.config.onSdkSessionIdCleared?.();
                    const recoveryContext = this.buildRecoveryContext();
                    if (recoveryContext && !isSlashCommandPrompt(message, attachments)) {
                        message = recoveryContext + message;
                    }
                    await this.ensureQwenSession();
                }
                else {
                    throw error;
                }
            }
            const sessionId = this.qwenSessionId;
            if (!sessionId)
                throw new Error('Qwen ACP session was not created');
            const prompt = this.buildPromptBlocks(message, attachments);
            let transcriptTextElementsPersisted = false;
            const persistTranscriptTextElements = async () => {
                if (transcriptTextElementsPersisted)
                    return;
                transcriptTextElementsPersisted = true;
                await this.persistQwenTranscriptTextElements(sessionId, this.qwenPersistenceCwd ?? this.resolvedCwd(), options?.textElements);
            };
            const promptPromise = this.callAcp('session/prompt', (connection) => connection.prompt({ sessionId, prompt }), 0);
            promptPromise
                .then(async (result) => {
                if (this.activePromptRunId !== promptRunId)
                    return;
                const stopReason = asString(toRecord(result).stopReason);
                await this.waitForCurrentTurnUsage();
                if (this.activePromptRunId !== promptRunId)
                    return;
                await persistTranscriptTextElements();
                if (this.activePromptRunId !== promptRunId)
                    return;
                this.flushThoughtText();
                this.flushAssistantText();
                this.eventQueue.enqueue({ type: 'complete' });
                this.eventQueue.complete();
                this.debug(`Qwen prompt complete${stopReason ? ` (${stopReason})` : ''}`);
            })
                .catch(async (error) => {
                if (this.activePromptRunId !== promptRunId)
                    return;
                if (this.abortReason) {
                    await persistTranscriptTextElements();
                    if (this.activePromptRunId !== promptRunId)
                        return;
                    this.eventQueue.complete();
                    return;
                }
                const message = formatQwenAcpErrorMessage(error);
                await persistTranscriptTextElements();
                if (this.activePromptRunId !== promptRunId)
                    return;
                this.eventQueue.enqueue({ type: 'error', message });
                this.eventQueue.enqueue({ type: 'complete' });
                this.eventQueue.complete();
            });
            for await (const event of this.eventQueue.drain()) {
                yield event;
                if (event.type === 'tool_result') {
                    const pendingRestart = this.consumePendingSourceActivationRestart();
                    if (pendingRestart) {
                        yield {
                            type: 'source_activated',
                            sourceSlug: pendingRestart.sourceSlug,
                            originalMessage: pendingRestart.userMessage,
                        };
                        this.forceAbort(AbortReason.SourceActivated);
                        return;
                    }
                }
            }
        }
        catch (error) {
            const message = formatQwenAcpErrorMessage(error);
            yield { type: 'error', message };
            yield { type: 'complete' };
        }
        finally {
            if (this.activePromptRunId === promptRunId) {
                this.activePromptRunId = null;
            }
            this._isProcessing = false;
            this.currentTurnId = undefined;
            this.currentAssistantText = '';
            this.currentThoughtText = '';
            this.currentIsSlashCommand = false;
            this.resolveUsageWaiters();
            this.midTurnMessageQueue = [];
        }
    }
    isProcessing() {
        return this._isProcessing;
    }
    waitForCurrentTurnUsage(timeoutMs = 50) {
        if (this.capturedUsageInCurrentTurn)
            return Promise.resolve();
        return new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done)
                    return;
                done = true;
                clearTimeout(timeout);
                this.usageWaiters = this.usageWaiters.filter((waiter) => waiter !== finish);
                resolve();
            };
            const timeout = setTimeout(finish, timeoutMs);
            this.usageWaiters.push(finish);
        });
    }
    resolveUsageWaiters() {
        const waiters = this.usageWaiters.splice(0);
        for (const resolve of waiters) {
            resolve();
        }
    }
    enqueueMidTurnMessage(message, attachments, metadata) {
        const trimmed = message.trim();
        if ((!trimmed && !attachments?.length) ||
            !this._isProcessing ||
            this.abortReason) {
            return false;
        }
        this.midTurnMessageQueue.push({
            message: trimmed,
            attachments,
            messageId: metadata?.messageId,
            optimisticMessageId: metadata?.optimisticMessageId,
        });
        this.debug(`Queued mid-turn user message for Qwen ACP injection (${this.midTurnMessageQueue.length} pending)`);
        return true;
    }
    async abort(reason) {
        this.debug(`Qwen abort requested${reason ? `: ${reason}` : ''}`);
        this.emitAutomationEvent('Stop', { hook_event_name: 'Stop' });
        this.abortReason = AbortReason.UserStop;
        this._isProcessing = false;
        this.activePromptRunId = null;
        this.midTurnMessageQueue = [];
        this.cancelPendingPermissions();
        const sessionId = this.qwenSessionId;
        if (sessionId && this.connection) {
            await this.callAcp('session/cancel', (connection) => connection.cancel({ sessionId }), 5_000).catch((error) => {
                this.debug(`Qwen cancel failed: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
        this.eventQueue.complete();
    }
    forceAbort(reason) {
        this.emitAutomationEvent('Stop', { hook_event_name: 'Stop' });
        this.abortReason = reason;
        this._isProcessing = false;
        this.activePromptRunId = null;
        this.midTurnMessageQueue = [];
        this.cancelPendingPermissions();
        this.eventQueue.complete();
        const sessionId = this.qwenSessionId;
        if (sessionId && this.connection) {
            void this.callAcp('session/cancel', (connection) => connection.cancel({ sessionId }), 5_000).catch((error) => {
                this.debug(`Qwen force cancel failed: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
    }
    respondToPermission(requestId, allowed, alwaysAllow, options) {
        const pending = this.pendingPermissions.get(requestId);
        if (!pending)
            return;
        this.resolvePendingPermission(requestId, this.createPermissionResponse(pending.options, allowed, !!alwaysAllow, options?.answers));
    }
    setPermissionMode(mode) {
        this.hasInitialModeOverride = true;
        this.pendingModeOverride = mode;
        super.setPermissionMode(mode);
        void this.forwardPermissionMode(mode);
    }
    cyclePermissionMode() {
        this.hasInitialModeOverride = true;
        const mode = super.cyclePermissionMode();
        this.pendingModeOverride = mode;
        void this.forwardPermissionMode(mode);
        return mode;
    }
    async getPermissionSettings() {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/permissions/getSettings', (connection) => connection.extMethod('qwen/permissions/getSettings', {
            cwd: this.resolvedCwd(),
        }), 10_000);
        return result;
    }
    async setPermissionRules(scope, ruleType, rules) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/permissions/setRules', (connection) => connection.extMethod('qwen/permissions/setRules', {
            cwd: this.resolvedCwd(),
            scope,
            ruleType,
            rules,
        }), 10_000);
        return result;
    }
    async getCoreSettings() {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/getCore', (connection) => connection.extMethod('qwen/settings/getCore', {
            cwd: this.resolvedCwd(),
        }), 10_000);
        return result;
    }
    async listProviders() {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/providers/list', (connection) => connection.extMethod('qwen/providers/list', {
            cwd: this.resolvedCwd(),
        }), 10_000);
        return normalizeQwenProviderCatalog(toRecord(result));
    }
    async connectProvider(params) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/providers/connect', (connection) => connection.extMethod('qwen/providers/connect', {
            cwd: this.resolvedCwd(),
            ...params,
        }), 30_000);
        return normalizeQwenProviderConnectResult(toRecord(result));
    }
    async setCoreSetting(scope, key, value) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/setCoreValue', (connection) => connection.extMethod('qwen/settings/setCoreValue', {
            cwd: this.resolvedCwd(),
            scope,
            key,
            value,
        }), 10_000);
        return result;
    }
    async setMcpServer(scope, name, server) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/setMcpServer', (connection) => connection.extMethod('qwen/settings/setMcpServer', {
            cwd: this.resolvedCwd(),
            scope,
            name,
            server,
        }), 10_000);
        return result;
    }
    async removeMcpServer(scope, name) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/removeMcpServer', (connection) => connection.extMethod('qwen/settings/removeMcpServer', {
            cwd: this.resolvedCwd(),
            scope,
            name,
        }), 10_000);
        return result;
    }
    async setHook(scope, event, index, hook) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/setHook', (connection) => connection.extMethod('qwen/settings/setHook', {
            cwd: this.resolvedCwd(),
            scope,
            event,
            index,
            hook,
        }), 10_000);
        return result;
    }
    async removeHook(scope, event, index) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/removeHook', (connection) => connection.extMethod('qwen/settings/removeHook', {
            cwd: this.resolvedCwd(),
            scope,
            event,
            index,
        }), 10_000);
        return result;
    }
    async setExtensionSetting(extensionId, settingKey, scope, value) {
        await this.ensureProcess();
        const result = await this.callAcp('qwen/settings/setExtensionSetting', (connection) => connection.extMethod('qwen/settings/setExtensionSetting', {
            cwd: this.resolvedCwd(),
            extensionId,
            settingKey,
            scope,
            value,
        }), 10_000);
        return result;
    }
    async installSkill(request) {
        await this.ensureProcess();
        this.invalidateAvailableCommandsSnapshot('skill install');
        const result = await this.callAcp('qwen/skills/install', (connection) => connection.extMethod('qwen/skills/install', {
            cwd: this.resolvedCwd(),
            skill: {
                ...request,
                scope: request.scope ?? 'global',
            },
        }), 120_000);
        const record = toRecord(result);
        const installedSkill = toRecord(record.skill);
        return {
            id: asString(record.id) ?? asString(installedSkill.id) ?? request.id,
            slug: asString(record.slug) ?? asString(installedSkill.slug) ?? request.slug,
            installed: asBoolean(record.installed) ?? true,
            installedPath: asString(record.installedPath) ??
                asString(record.installed_path) ??
                asString(installedSkill.installedPath) ??
                asString(installedSkill.installed_path),
            message: asString(record.message),
        };
    }
    async deleteSkill(request) {
        await this.ensureProcess();
        this.invalidateAvailableCommandsSnapshot('skill delete');
        const result = await this.callAcp('qwen/skills/delete', (connection) => connection.extMethod('qwen/skills/delete', {
            cwd: this.resolvedCwd(),
            skill: {
                ...request,
                scope: request.scope ?? 'global',
            },
        }), 10_000);
        const record = toRecord(result);
        const deletedSkill = toRecord(record.skill);
        return {
            slug: asString(record.slug) ?? asString(deletedSkill.slug) ?? request.slug,
            deleted: asBoolean(record.deleted) ?? true,
            message: asString(record.message),
        };
    }
    async setSkillEnabled(request) {
        await this.ensureProcess();
        this.invalidateAvailableCommandsSnapshot('skill enabled state change');
        const result = await this.callAcp('qwen/skills/setEnabled', (connection) => connection.extMethod('qwen/skills/setEnabled', {
            cwd: this.resolvedCwd(),
            skill: {
                ...request,
                scope: request.scope ?? 'global',
            },
        }), 10_000);
        const record = toRecord(result);
        const updatedSkill = toRecord(record.skill);
        return {
            slug: asString(record.slug) ?? asString(updatedSkill.slug) ?? request.slug,
            enabled: asBoolean(record.enabled) ?? request.enabled,
            installedPath: asString(record.installedPath) ??
                asString(record.installed_path) ??
                asString(updatedSkill.installedPath) ??
                asString(updatedSkill.installed_path),
            message: asString(record.message),
        };
    }
    setModel(model) {
        if (!this.isKnownAvailableModel(model)) {
            this.debug(`Ignoring Qwen model switch for unavailable model: ${model}`);
            return;
        }
        super.setModel(model);
        this.applyCurrentModelContextWindow(model);
        void this.forwardModel(model);
    }
    async setSourceServers(mcpServers, apiServers, intendedSlugs) {
        this.sourceMcpServers = mcpServers;
        await super.setSourceServers(mcpServers, apiServers, intendedSlugs);
    }
    async runMiniCompletion(prompt) {
        const result = await this.queryLlm({ prompt });
        return result.text.trim() || null;
    }
    async listSessions(options = {}) {
        await this.ensureProcess();
        const response = await this.callAcp('session/list', (connection) => connection.listSessions({
            cwd: options.cwd || this.resolvedCwd(),
            cursor: options.cursor,
            _meta: options.size && options.size > 0
                ? { size: Math.floor(options.size) }
                : undefined,
        }), 60_000);
        return {
            nextCursor: response.nextCursor ?? undefined,
            sessions: response.sessions.map((session) => ({
                sessionId: session.sessionId,
                cwd: session.cwd,
                title: session.title,
                createdAt: typeof session._meta?.createdAt === 'string'
                    ? session._meta.createdAt
                    : null,
                updatedAt: session.updatedAt,
                startTime: typeof session._meta?.['startTime'] === 'string'
                    ? session._meta['startTime']
                    : undefined,
                preview: typeof session._meta?.['preview'] === 'string'
                    ? session._meta['preview']
                    : undefined,
                messageCount: typeof session._meta?.['messageCount'] === 'number'
                    ? session._meta['messageCount']
                    : undefined,
                gitBranch: typeof session._meta?.['gitBranch'] === 'string'
                    ? session._meta['gitBranch']
                    : undefined,
                titleSource: session._meta?.['titleSource'] === 'manual' ||
                    session._meta?.['titleSource'] === 'auto'
                    ? session._meta['titleSource']
                    : undefined,
            })),
        };
    }
    async deleteBackendSession(sessionId, options = {}) {
        await this.ensureProcess();
        const result = toRecord(await this.callAcp('ext/deleteSession', (connection) => connection.extMethod('deleteSession', {
            sessionId,
            cwd: options.cwd || this.resolvedCwd(),
        }), 30_000));
        return result.success !== false;
    }
    async rewindToUserTurn(targetTurnIndex) {
        if (!Number.isInteger(targetTurnIndex) || targetTurnIndex < 0) {
            throw new Error('targetTurnIndex must be a non-negative integer');
        }
        await this.ensureProcess();
        await this.ensureQwenSession();
        const sessionId = this.qwenSessionId;
        if (!sessionId)
            throw new Error('Qwen ACP session was not created');
        const result = toRecord(await this.callAcp('ext/rewindSession', (connection) => connection.extMethod('rewindSession', {
            sessionId,
            targetTurnIndex,
            cwd: this.resolvedCwd(),
        }), 30_000));
        if (result.success !== true) {
            throw new Error('Qwen ACP rewindSession did not report success');
        }
        const resultTargetTurnIndex = Number.isInteger(result.targetTurnIndex)
            ? result.targetTurnIndex
            : undefined;
        const resultApiTruncateIndex = Number.isInteger(result.apiTruncateIndex)
            ? result.apiTruncateIndex
            : undefined;
        return {
            historyBeforeRewind: Array.isArray(result.historyBeforeRewind)
                ? result.historyBeforeRewind
                : undefined,
            targetTurnIndex: resultTargetTurnIndex,
            apiTruncateIndex: resultApiTruncateIndex,
        };
    }
    async renameBackendSession(sessionId, title, options = {}) {
        await this.ensureProcess();
        const result = toRecord(await this.callAcp('ext/renameSession', (connection) => connection.extMethod('renameSession', {
            sessionId,
            title,
            cwd: options.cwd || this.resolvedCwd(),
        }), 30_000));
        return result.success !== false;
    }
    async loadSessionMessages(sessionId, options = {}) {
        const requestedCwd = options.cwd || this.resolvedCwd();
        const cwd = this.resolveQwenPersistenceCwd(sessionId, requestedCwd);
        await this.ensureProcess();
        const buildResultFromUpdates = (updates) => {
            const messages = this.buildHistoryMessages(sessionId, updates, cwd);
            const availableCommandsSnapshot = this.extractAvailableCommandsSnapshot(updates);
            const tokenUsage = this.extractLatestTokenUsage(updates);
            const mergedMessages = this.mergeSlashCommandInvocationMessages(sessionId, messages, cwd);
            const messagesWithTranscriptTelemetry = this.mergeQwenTranscriptTelemetryMessages(sessionId, mergedMessages, cwd);
            const messagesWithTextElements = this.applyQwenTranscriptTextElements(messagesWithTranscriptTelemetry, sessionId, cwd);
            return {
                messages: messagesWithTextElements,
                ...(availableCommandsSnapshot ?? {}),
                ...(tokenUsage ? { tokenUsage } : {}),
            };
        };
        try {
            const response = toRecord(await this.callAcp('ext/qwen/session/loadUpdates', (connection) => connection.extMethod('qwen/session/loadUpdates', {
                sessionId,
                cwd,
            }), 30_000));
            const updates = Array.isArray(response.updates)
                ? response.updates.filter(isRecord)
                : undefined;
            if (updates) {
                return buildResultFromUpdates(updates);
            }
        }
        catch (error) {
            this.debug(`Qwen loadSessionMessages extension unavailable; falling back to session/load for ${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
        const collector = { updates: [] };
        this.historyCollectors.set(sessionId, collector);
        try {
            await this.callAcp('session/load', (connection) => connection.loadSession({
                sessionId,
                cwd,
                mcpServers: this.buildAcpMcpServers(),
            }), 60_000);
            return buildResultFromUpdates(collector.updates);
        }
        finally {
            this.historyCollectors.delete(sessionId);
        }
    }
    async refreshAvailableCommands() {
        this.debug(`Qwen slash command refresh requested (session=${this.qwenSessionId ?? this.persistedQwenSessionId ?? 'none'}, cwd=${this.resolvedCwd()})`);
        const hadLiveSessionBeforeRefresh = !!this.qwenSessionId;
        await this.ensureProcess();
        await this.ensureQwenSession();
        if (this.latestAvailableCommandsSnapshot) {
            this.debug(`Qwen slash command refresh using latest snapshot: commands=${this.latestAvailableCommandsSnapshot.availableCommands.length} ` +
                `skills=${this.latestAvailableCommandsSnapshot.availableSkills?.length ?? 0} ` +
                `names=${formatDebugNames(this.latestAvailableCommandsSnapshot.availableCommands.map((command) => command.name))}`);
            return this.latestAvailableCommandsSnapshot;
        }
        if (hadLiveSessionBeforeRefresh) {
            const reloadedSnapshot = await this.reloadCurrentSessionForAvailableCommands();
            if (reloadedSnapshot) {
                this.debug(`Qwen slash command refresh reused current session after reload: commands=${reloadedSnapshot.availableCommands.length} ` +
                    `skills=${reloadedSnapshot.availableSkills?.length ?? 0} ` +
                    `names=${formatDebugNames(reloadedSnapshot.availableCommands.map((command) => command.name))}`);
                return reloadedSnapshot;
            }
        }
        this.debug('Qwen slash command refresh waiting for available_commands_update');
        const snapshot = await this.waitForAvailableCommandsSnapshot();
        this.debug(snapshot
            ? `Qwen slash command refresh received after wait: commands=${snapshot.availableCommands.length} skills=${snapshot.availableSkills?.length ?? 0} names=${formatDebugNames(snapshot.availableCommands.map((command) => command.name))}`
            : 'Qwen slash command refresh timed out waiting for available_commands_update');
        return snapshot;
    }
    async queryLlm(request) {
        await this.ensureProcess();
        const sessionId = await this.createEphemeralSession();
        const collector = { chunks: [] };
        this.miniCollectors.set(sessionId, collector);
        try {
            const model = request.model;
            if (model) {
                await this.callAcp('session/set_config_option', (connection) => connection.setSessionConfigOption({
                    sessionId,
                    configId: 'model',
                    value: model,
                }), 10_000).catch((error) => {
                    this.debug(`Qwen mini model switch failed: ${error instanceof Error ? error.message : String(error)}`);
                });
            }
            const prompt = this.buildQueryPrompt(request);
            await this.callAcp('session/prompt', (connection) => connection.prompt({
                sessionId,
                prompt: [{ type: 'text', text: prompt }],
            }), LLM_QUERY_TIMEOUT_MS);
            return {
                text: collector.chunks.join('').trim(),
                model: request.model || this._model || undefined,
                inputTokens: collector.inputTokens,
                outputTokens: collector.outputTokens,
            };
        }
        finally {
            this.miniCollectors.delete(sessionId);
            await this.deleteBackendSession(sessionId).catch((error) => {
                this.debug(`Qwen mini session cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
            });
            this.unregisterAcpSession(sessionId);
        }
    }
    destroy() {
        super.destroy();
        this.killSubprocess();
        this.cancelPendingPermissions();
        this.miniCollectors.clear();
        this.historyCollectors.clear();
        this.ensureProcessPromise = null;
    }
    // ============================================================
    // ACP process and SDK connection
    // ============================================================
    async ensureProcess() {
        if (this.acpLease?.isActive() &&
            this.connection &&
            !this.connection.signal.aborted)
            return;
        if (this.ensureProcessPromise) {
            await this.ensureProcessPromise;
            return;
        }
        this.ensureProcessPromise = this.startProcess();
        try {
            await this.ensureProcessPromise;
        }
        finally {
            this.ensureProcessPromise = null;
        }
    }
    async startProcess() {
        this.connection = null;
        this.acpLease?.release();
        this.acpLease = null;
        const runtime = getBackendRuntime(this.config);
        const qwenCliPath = runtime.paths?.qwenCli;
        if (!qwenCliPath) {
            throw new Error('Qwen Code CLI not found. Build the current qwen-code checkout with npm run build && npm run bundle, or set QWEN_CODE_CLI to a dist/cli.js path.');
        }
        const nodePath = runtime.paths?.node || process.execPath;
        const { command, args } = this.buildSpawnCommand(qwenCliPath, nodePath);
        const cwd = this.config.workspace.rootPath || this.resolvedCwd();
        const commandDescription = `${command} ${args.join(' ')}`;
        const key = buildSharedAcpProcessKey({
            command,
            spawnArgs: args,
            workspaceRootPath: cwd,
            envOverrides: this.config.envOverrides,
        });
        try {
            this.acpLease = await acquireSharedQwenAcpProcess({
                key,
                command,
                args,
                cwd,
                envOverrides: this.config.envOverrides,
            }, {
                onSessionUpdate: (params) => this.handleSessionUpdate(params),
                onPermissionRequest: (params) => this.handlePermissionRequest(params),
                onExtMethod: (method, params) => this.handleExtMethod(method, params),
                onProcessExit: (code, signal) => this.handleProcessExit(code, signal),
                onDebug: (message) => this.debug(message),
            });
            this.connection = this.acpLease.connection;
        }
        catch (error) {
            const originalMessage = formatQwenAcpErrorMessage(error);
            const recentStderr = this.getRecentStderr().trim();
            const message = [
                originalMessage,
                `Qwen command: ${commandDescription}`,
                recentStderr ? `Recent Qwen stderr:\n${recentStderr}` : undefined,
            ]
                .filter(Boolean)
                .join('\n');
            const wrapped = new Error(message);
            wrapped.cause = error;
            throw wrapped;
        }
    }
    buildSpawnCommand(qwenCliPath, nodePath) {
        const args = ['--acp', '--channel=desktop'];
        if (qwenCliPath.endsWith('.js')) {
            return { command: nodePath, args: [qwenCliPath, ...args] };
        }
        return { command: qwenCliPath, args };
    }
    async handleExtMethod(method, params) {
        if (method !== MID_TURN_QUEUE_DRAIN_METHOD &&
            method !== TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD) {
            return {};
        }
        const sessionId = asString(params.sessionId);
        const managedSessionId = this.config.session?.id;
        const isCurrentSession = !!sessionId &&
            (sessionId === this.qwenSessionId || sessionId === managedSessionId);
        if (!isCurrentSession) {
            if (sessionId) {
                this.debug(`Ignored ${method} for non-current session ${sessionId}`);
            }
            return {};
        }
        if (method === TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD) {
            return { claimed: true, hasQueuedPrompt: false };
        }
        const entries = this.midTurnMessageQueue.splice(0);
        const hasAttachments = entries.some((entry) => entry.attachments && entry.attachments.length > 0);
        if (!hasAttachments) {
            if (entries.length > 0) {
                this.debug(`Drained ${entries.length} mid-turn user message(s) to Qwen ACP`);
                this.config.onMidTurnMessagesDrained?.(entries.map((entry) => entry.messageId ?? entry.optimisticMessageId ?? entry.message));
            }
            return {
                messages: entries.map((entry) => entry.message),
                hasQueuedPrompt: false,
            };
        }
        const items = [];
        const messageIds = [];
        const failedEntries = [];
        for (const entry of entries) {
            const displayText = entry.message || '[User message with attachments]';
            try {
                items.push({
                    content: this.buildPromptBlocks(entry.message, entry.attachments, {
                        includeContext: false,
                    }),
                    displayText,
                });
                messageIds.push(entry.messageId ?? entry.optimisticMessageId ?? entry.message);
            }
            catch (error) {
                const buildFailureCount = (entry.buildFailureCount ?? 0) + 1;
                this.debug(`Failed to build mid-turn content blocks (${buildFailureCount}/${MAX_MID_TURN_CONTENT_BUILD_FAILURES}): ${getErrorMessage(error)}`);
                if (buildFailureCount >= MAX_MID_TURN_CONTENT_BUILD_FAILURES) {
                    items.push({
                        content: [
                            { type: 'text', text: displayText },
                            {
                                type: 'text',
                                text: MID_TURN_ATTACHMENT_PROCESSING_FAILURE_TEXT,
                            },
                        ],
                        displayText,
                    });
                    messageIds.push(entry.messageId ?? entry.optimisticMessageId ?? entry.message);
                }
                else {
                    failedEntries.push({ ...entry, buildFailureCount });
                }
            }
        }
        if (failedEntries.length > 0) {
            this.midTurnMessageQueue.unshift(...failedEntries);
        }
        if (messageIds.length > 0) {
            this.debug(`Drained ${messageIds.length} mid-turn user message(s) to Qwen ACP`);
            this.config.onMidTurnMessagesDrained?.(messageIds);
        }
        return {
            items,
            hasQueuedPrompt: false,
        };
    }
    getAcpConnection() {
        if (!this.connection ||
            this.connection.signal.aborted ||
            !this.acpLease?.isActive()) {
            throw new Error('Qwen ACP process is not running');
        }
        return this.connection;
    }
    callAcp(method, execute, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
        return this.withTimeout(execute(this.getAcpConnection()), method, timeoutMs);
    }
    withTimeout(promise, method, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
        if (timeoutMs <= 0)
            return promise;
        let timeout;
        const timeoutPromise = new Promise((_, reject) => {
            timeout = setTimeout(() => {
                reject(new Error(`Qwen ACP request timed out: ${method}`));
            }, timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => {
            if (timeout)
                clearTimeout(timeout);
        });
    }
    handleProcessExit(code, signal) {
        const message = `Qwen ACP process exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`;
        this.debug(message);
        this.acpLease = null;
        this.connection = null;
        this.cancelPendingPermissions();
        if (this._isProcessing && !this.abortReason) {
            this.eventQueue.enqueue({ type: 'error', message });
            this.eventQueue.enqueue({ type: 'complete' });
            this.eventQueue.complete();
        }
    }
    killSubprocess() {
        for (const sessionId of [
            this.qwenSessionId,
            ...this.miniCollectors.keys(),
            ...this.historyCollectors.keys(),
        ]) {
            if (sessionId)
                this.unregisterAcpSession(sessionId);
        }
        this.connection = null;
        this.acpLease?.release();
        this.acpLease = null;
    }
    registerAcpSession(sessionId) {
        this.acpLease?.registerSession(sessionId);
    }
    unregisterAcpSession(sessionId) {
        this.acpLease?.unregisterSession(sessionId);
    }
    // ============================================================
    // Session management
    // ============================================================
    async ensureQwenSession() {
        if (this.qwenSessionId) {
            this.debug(`Qwen ACP session reuse: using live session ${this.qwenSessionId}`);
            this.registerAcpSession(this.qwenSessionId);
            await this.applySessionSettings(this.qwenSessionId);
            this.flushPendingAvailableCommandsUpdate(this.qwenSessionId);
            return;
        }
        if (this.ensureQwenSessionPromise) {
            this.debug('Qwen ACP session reuse: waiting for in-flight session setup');
            await this.ensureQwenSessionPromise;
            return;
        }
        this.ensureQwenSessionPromise = this.createOrLoadQwenSession();
        try {
            await this.ensureQwenSessionPromise;
        }
        finally {
            this.ensureQwenSessionPromise = null;
        }
    }
    async createOrLoadQwenSession() {
        if (this.qwenSessionId) {
            this.debug(`Qwen ACP session reuse: using live session ${this.qwenSessionId}`);
            this.registerAcpSession(this.qwenSessionId);
            await this.applySessionSettings(this.qwenSessionId);
            this.flushPendingAvailableCommandsUpdate(this.qwenSessionId);
            return;
        }
        const cwd = this.resolvedCwd();
        const mcpServers = this.buildAcpMcpServers();
        const existingSessionId = this.persistedQwenSessionId ?? this.config.session?.sdkSessionId;
        if (existingSessionId) {
            this.debug(`Qwen ACP session reuse: loading persisted session ${existingSessionId}`);
            this.suppressedSessionUpdates.add(existingSessionId);
            try {
                const result = toRecord(await this.callAcp('session/load', (connection) => connection.loadSession({
                    sessionId: existingSessionId,
                    cwd,
                    mcpServers,
                }), 60_000));
                this.qwenSessionId = existingSessionId;
                this.persistedQwenSessionId = existingSessionId;
                this.qwenPersistenceCwd = cwd;
                this.registerAcpSession(existingSessionId);
                this.recordSessionModels(result);
                this.recordSessionModes(result);
                this.config.onSdkSessionIdUpdate?.(existingSessionId);
                await this.applySessionSettings(existingSessionId);
                this.flushPendingAvailableCommandsUpdate(existingSessionId);
                return;
            }
            finally {
                this.suppressedSessionUpdates.delete(existingSessionId);
            }
        }
        this.debug('Qwen ACP session reuse: no existing session id, creating a new ACP session');
        const result = toRecord(await this.callAcp('session/new', (connection) => connection.newSession({
            cwd,
            mcpServers,
        }), 60_000));
        const sessionId = asString(result.sessionId);
        if (!sessionId) {
            throw new Error('Qwen ACP did not return a sessionId');
        }
        this.qwenSessionId = sessionId;
        this.persistedQwenSessionId = sessionId;
        this.qwenPersistenceCwd = cwd;
        this.registerAcpSession(sessionId);
        this.recordSessionModels(result);
        this.recordSessionModes(result);
        this.config.onSdkSessionIdUpdate?.(sessionId);
        await this.applySessionSettings(sessionId);
        this.flushPendingAvailableCommandsUpdate(sessionId);
    }
    async reloadCurrentSessionForAvailableCommands() {
        const sessionId = this.qwenSessionId;
        if (!sessionId)
            return null;
        if (this._isProcessing) {
            this.debug(`Qwen slash command refresh did not reload session ${sessionId} because a prompt is active`);
            return null;
        }
        this.debug(`Qwen slash command refresh reloading existing ACP session ${sessionId} to request available_commands_update`);
        this.suppressedSessionUpdates.add(sessionId);
        try {
            const result = toRecord(await this.callAcp('session/load', (connection) => connection.loadSession({
                sessionId,
                cwd: this.resolveQwenPersistenceCwd(sessionId, this.resolvedCwd()),
                mcpServers: this.buildAcpMcpServers(),
            }), 60_000));
            this.recordSessionModels(result);
            this.recordSessionModes(result);
            await this.applySessionSettings(sessionId);
        }
        finally {
            this.suppressedSessionUpdates.delete(sessionId);
            this.flushPendingAvailableCommandsUpdate(sessionId);
        }
        return this.latestAvailableCommandsSnapshot;
    }
    async createEphemeralSession() {
        const result = toRecord(await this.callAcp('session/new', (connection) => connection.newSession({
            cwd: this.resolvedCwd(),
            mcpServers: [],
        }), 60_000));
        const sessionId = asString(result.sessionId);
        if (!sessionId) {
            throw new Error('Qwen ACP did not return a sessionId for mini completion');
        }
        this.registerAcpSession(sessionId);
        this.recordSessionModels(result);
        return sessionId;
    }
    recordSessionModels(result) {
        const modelState = toRecord(result.models);
        const availableModels = Array.isArray(modelState.availableModels)
            ? modelState.availableModels
                .map(toQwenModelDefinition)
                .filter((model) => !!model)
            : [];
        const currentModelId = asString(modelState.currentModelId);
        this.availableModelIds = new Set(availableModels.map((model) => model.id));
        this.availableModelsById = new Map(availableModels.map((model) => [model.id, model]));
        this.firstAvailableModelId = availableModels[0]?.id;
        const selectableCurrentModelId = currentModelId && this.availableModelIds.has(currentModelId)
            ? currentModelId
            : undefined;
        if ((!this._model || !this.isKnownAvailableModel(this._model)) &&
            (selectableCurrentModelId || this.firstAvailableModelId)) {
            super.setModel(selectableCurrentModelId || this.firstAvailableModelId || '');
        }
        this.applyCurrentModelContextWindow();
        if (availableModels.length > 0) {
            this.config.onAvailableModelsUpdate?.(availableModels, currentModelId);
        }
    }
    isKnownAvailableModel(model) {
        return (!this.availableModelIds ||
            this.availableModelIds.size === 0 ||
            this.availableModelIds.has(model));
    }
    getCurrentModelContextWindow(model = this._model) {
        return model
            ? this.availableModelsById.get(model)?.contextWindow
            : undefined;
    }
    applyCurrentModelContextWindow(model = this._model) {
        const contextWindow = this.getCurrentModelContextWindow(model);
        if (contextWindow) {
            this.usageTracker.setContextWindow(contextWindow);
        }
    }
    recordSessionModes(result) {
        if (this.pendingModeOverride)
            return;
        const modeState = toRecord(result.modes);
        const currentModeId = asString(modeState.currentModeId);
        const mode = mapQwenModeToPermissionMode(currentModeId);
        if (!mode || mode === this.getPermissionMode())
            return;
        this.applyAcpPermissionMode(mode);
    }
    async forwardModel(model, sessionId = this.qwenSessionId, options = {}) {
        if (!model || !sessionId)
            return;
        if (!this.isKnownAvailableModel(model)) {
            this.debug(`Skipping Qwen model forward for unavailable model: ${model}`);
            return;
        }
        try {
            if (options.persistDefault ?? true) {
                await this.callAcp('session/set_model', (connection) => connection.unstable_setSessionModel({
                    sessionId,
                    modelId: model,
                }), 10_000);
            }
            else {
                await this.callAcp('session/set_config_option', (connection) => connection.setSessionConfigOption({
                    sessionId,
                    configId: 'model',
                    value: model,
                }), 10_000);
            }
        }
        catch (error) {
            this.debug(`Qwen session/set_model failed: ${error instanceof Error ? error.message : String(error)}`);
            await this.callAcp('session/set_config_option', (connection) => connection.setSessionConfigOption({
                sessionId,
                configId: 'model',
                value: model,
            }), 10_000).catch((fallbackError) => {
                this.debug(`Qwen model config fallback failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
            });
        }
    }
    async applySessionSettings(sessionId) {
        if (this.hasInitialModeOverride) {
            await this.forwardPermissionMode(this.getPermissionMode(), sessionId);
        }
        if (this._model) {
            await this.forwardModel(this._model, sessionId);
        }
    }
    async forwardPermissionMode(mode, sessionId = this.qwenSessionId) {
        if (!sessionId || !this.connection || this.connection.signal.aborted)
            return;
        try {
            await this.callAcp('session/set_mode', (connection) => connection.setSessionMode({
                sessionId,
                modeId: mapPermissionModeToQwen(mode),
            }), 10_000);
            if (this.pendingModeOverride === mode) {
                this.pendingModeOverride = null;
            }
        }
        catch (error) {
            this.debug(`Qwen mode switch failed: ${error instanceof Error ? error.message : String(error)}`);
            if (this.pendingModeOverride === mode) {
                this.pendingModeOverride = null;
            }
        }
    }
    resolvedCwd() {
        return (this.config.session?.workingDirectory ||
            this.workingDirectory ||
            this.config.workspace.rootPath ||
            process.cwd());
    }
    resolveQwenPersistenceCwd(sessionId, fallback) {
        return sessionId === this.qwenSessionId ||
            sessionId === this.persistedQwenSessionId
            ? (this.qwenPersistenceCwd ?? fallback)
            : fallback;
    }
    extractQwenRecordText(record) {
        if (record.type === 'user') {
            return projectQwenUserRecordText(record);
        }
        const message = toRecord(record.message);
        const parts = Array.isArray(message.parts)
            ? message.parts.filter(isRecord)
            : [];
        return parts
            .map((part) => asString(part.text))
            .filter((text) => !!text)
            .join('\n\n');
    }
    getQwenTranscriptPatchContent(record) {
        if (record.type === 'system' && record.subtype === 'slash_command') {
            const payload = toRecord(record.systemPayload);
            if (payload.phase === 'invocation') {
                return asString(payload.rawCommand) || '';
            }
        }
        return this.extractQwenRecordText(record);
    }
    isPatchableQwenUserRecord(record, sessionId) {
        if (record.sessionId !== sessionId)
            return false;
        if (record.type === 'user')
            return true;
        if (record.type !== 'system' || record.subtype !== 'slash_command')
            return false;
        const payload = toRecord(record.systemPayload);
        return payload.phase === 'invocation' && payload.hiddenInvocation !== true;
    }
    async persistQwenTranscriptTextElements(sessionId, cwd, sourceElements) {
        const transcriptPath = getQwenTranscriptPath(sessionId, this.resolveQwenPersistenceCwd(sessionId, cwd));
        if (!existsSync(transcriptPath))
            return;
        let fileContent;
        try {
            fileContent = readFileSync(transcriptPath, 'utf8');
        }
        catch (error) {
            this.debug(`Failed to read Qwen transcript for text elements: ${error instanceof Error ? error.message : String(error)}`);
            return;
        }
        const lines = fileContent.split(/\r?\n/);
        if (lines[lines.length - 1] === '')
            lines.pop();
        for (let index = lines.length - 1; index >= 0; index -= 1) {
            const line = lines[index];
            if (!line?.trim())
                continue;
            let record;
            try {
                record = JSON.parse(line);
            }
            catch {
                continue;
            }
            if (!this.isPatchableQwenUserRecord(record, sessionId))
                continue;
            const content = this.getQwenTranscriptPatchContent(record);
            const textElements = buildQwenTranscriptTextElements(content, sourceElements);
            if (!textElements)
                return;
            const existing = JSON.stringify(record.textElements ?? null);
            const next = JSON.stringify(textElements);
            if (existing === next)
                return;
            try {
                await this.callAcp('ext/qwen/session/recordTextElements', (connection) => connection.extMethod('qwen/session/recordTextElements', {
                    sessionId,
                    content,
                    textElements,
                }), 30_000);
                this.debug(`Recorded ${textElements.length} text element(s) for Qwen session ${sessionId}`);
            }
            catch (error) {
                this.debug(`Failed to write Qwen transcript text elements: ${error instanceof Error ? error.message : String(error)}`);
            }
            return;
        }
    }
    readQwenTranscriptTextElements(sessionId, cwd) {
        const transcriptPath = getQwenTranscriptPath(sessionId, this.resolveQwenPersistenceCwd(sessionId, cwd));
        if (!existsSync(transcriptPath))
            return [];
        let fileContent;
        try {
            fileContent = readFileSync(transcriptPath, 'utf8');
        }
        catch {
            return [];
        }
        const records = [];
        for (const line of fileContent.split(/\r?\n/)) {
            if (!line.trim())
                continue;
            let record;
            try {
                record = JSON.parse(line);
            }
            catch {
                continue;
            }
            const textElementPayload = record.sessionId === sessionId &&
                record.type === 'system' &&
                record.subtype === 'user_text_elements'
                ? toRecord(record.systemPayload)
                : undefined;
            if (!textElementPayload &&
                !this.isPatchableQwenUserRecord(record, sessionId)) {
                continue;
            }
            const textElements = toQwenTranscriptTextElements(textElementPayload?.textElements ?? record.textElements);
            if (!textElements)
                continue;
            const content = textElementPayload
                ? asString(textElementPayload.content) || ''
                : this.getQwenTranscriptPatchContent(record);
            if (!content)
                continue;
            records.push({ content, textElements });
        }
        return records;
    }
    applyQwenTranscriptTextElements(messages, sessionId, cwd) {
        const records = this.readQwenTranscriptTextElements(sessionId, cwd);
        if (records.length === 0)
            return messages;
        const remaining = [...records];
        for (const message of messages) {
            if (message.role !== 'user' || message.textElements?.length)
                continue;
            const index = remaining.findIndex((record) => record.content === message.content);
            if (index < 0)
                continue;
            message.textElements = remaining[index].textElements;
            remaining.splice(index, 1);
        }
        return messages;
    }
    buildAcpMcpServers() {
        if (this.config.poolServerUrl) {
            return [
                {
                    type: 'http',
                    name: 'craft_sources',
                    url: this.config.poolServerUrl,
                    headers: [],
                },
            ];
        }
        return Object.entries(this.sourceMcpServers).map(([name, config]) => {
            if (config.type === 'stdio') {
                const env = new Map();
                for (const [key, value] of Object.entries(config.env ?? {})) {
                    env.set(key, value);
                }
                for (const key of config.envVars ?? []) {
                    const value = process.env[key];
                    if (value !== undefined)
                        env.set(key, value);
                }
                return {
                    name,
                    command: config.command,
                    args: config.args ?? [],
                    env: [...env.entries()].map(([envName, value]) => ({
                        name: envName,
                        value,
                    })),
                };
            }
            const headers = new Map();
            for (const [key, value] of Object.entries(config.headers ?? {})) {
                headers.set(key, value);
            }
            if (config.bearerTokenEnvVar && process.env[config.bearerTokenEnvVar]) {
                headers.set('Authorization', `Bearer ${process.env[config.bearerTokenEnvVar]}`);
            }
            return {
                type: config.type,
                name,
                url: config.url,
                headers: [...headers.entries()].map(([headerName, value]) => ({
                    name: headerName,
                    value,
                })),
            };
        });
    }
    // ============================================================
    // Prompt construction
    // ============================================================
    buildPromptBlocks(message, attachments, options) {
        const includeContext = options?.includeContext ?? true;
        if (includeContext && isSlashCommandPrompt(message, attachments)) {
            return [{ type: 'text', text: message.trim() }];
        }
        const textParts = [];
        const context = includeContext && INCLUDE_CRAFT_CONTEXT_IN_QWEN_PROMPTS
            ? this.buildCraftContext()
            : '';
        for (const attachment of attachments ?? []) {
            if (attachment.mimeType?.startsWith('image/') && attachment.base64) {
                continue;
            }
            const filePath = attachment.storedPath || attachment.markdownPath || attachment.path;
            if (filePath) {
                textParts.push(`[Attached file: ${attachment.name}]\n[Stored at: ${filePath}]`);
            }
            else if (attachment.text) {
                textParts.push(`[Attached text: ${attachment.name}]\n${attachment.text}`);
            }
            else {
                this.debug(`Skipping attachment ${attachment.name} while building prompt blocks: no readable content`);
            }
        }
        textParts.push(message);
        const text = textParts.filter(Boolean).join('\n\n');
        const blocks = [];
        if (text || context) {
            blocks.push({
                type: 'text',
                text: context ? `${text}\n\n` : text,
            });
        }
        if (context) {
            blocks.push({
                type: 'resource',
                resource: {
                    uri: `craft://agent-context/${encodeURIComponent(this._sessionId)}`,
                    mimeType: 'text/plain',
                    text: `<craft_agent_context>\n${context}\n</craft_agent_context>`,
                },
                _meta: {
                    source: 'craft-agent',
                    hiddenFromPromptDisplay: true,
                },
            });
        }
        for (const attachment of attachments ?? []) {
            if (attachment.mimeType?.startsWith('image/') && attachment.base64) {
                blocks.push({
                    type: 'image',
                    data: attachment.base64,
                    mimeType: attachment.mimeType,
                });
            }
        }
        return blocks;
    }
    buildCraftContext() {
        const systemPrompt = getSystemPrompt(undefined, this.config.debugMode, this.config.workspace.rootPath, this.config.session?.workingDirectory, this.config.systemPromptPreset, this.backendName, getCoAuthorPreference());
        const sourceContext = this.sourceManager.formatSourceState();
        const contextParts = this.promptBuilder.buildContextParts({
            plansFolderPath: getSessionPlansPath(this.config.workspace.rootPath, this._sessionId),
        }, sourceContext);
        return [systemPrompt, ...contextParts].filter(Boolean).join('\n\n');
    }
    buildQueryPrompt(request) {
        const parts = [];
        if (request.systemPrompt) {
            parts.push(`System instructions:\n${request.systemPrompt}`);
        }
        if (request.outputSchema) {
            parts.push(`Return a JSON value that conforms to this schema:\n${jsonStringify(request.outputSchema)}`);
        }
        parts.push(request.prompt);
        return parts.join('\n\n');
    }
    // ============================================================
    // Update adaptation
    // ============================================================
    handleSessionUpdate(params) {
        const record = toRecord(params);
        const sessionId = asString(record.sessionId);
        const update = toRecord(record.update);
        if (!sessionId || !update.sessionUpdate)
            return;
        const collector = this.miniCollectors.get(sessionId);
        if (collector) {
            this.collectMiniUpdate(collector, update);
            return;
        }
        const historyCollector = this.historyCollectors.get(sessionId);
        if (historyCollector) {
            historyCollector.updates.push(update);
            return;
        }
        if (update.sessionUpdate === 'available_commands_update') {
            this.handleOrStoreAvailableCommandsUpdate(sessionId, update);
            return;
        }
        if (this.suppressedSessionUpdates.has(sessionId))
            return;
        if (sessionId !== this.qwenSessionId || !this._isProcessing)
            return;
        this.captureUsage(update);
        switch (update.sessionUpdate) {
            case 'agent_message_chunk':
                this.flushThoughtText();
                this.handleAgentMessageChunk(update);
                break;
            case 'agent_thought_chunk':
                this.flushAssistantText(true);
                this.handleAgentThoughtChunk(update);
                break;
            case 'tool_call':
                this.flushPendingTextAsIntermediate();
                this.handleToolCall(update);
                break;
            case 'tool_call_update':
                this.flushPendingTextAsIntermediate();
                this.handleToolCallUpdate(update);
                break;
            case 'plan':
                this.flushPendingTextAsIntermediate();
                this.handlePlanUpdate(update);
                break;
            case 'current_mode_update':
                this.handleModeUpdate(update);
                break;
            default:
                break;
        }
    }
    collectMiniUpdate(collector, update) {
        this.captureUsageInto(collector, update);
        if (update.sessionUpdate !== 'agent_message_chunk')
            return;
        const content = toRecord(update.content);
        if (content.type !== 'text')
            return;
        const text = asString(content.text);
        if (text)
            collector.chunks.push(text);
    }
    buildHistoryMessages(sessionId, updates, _cwd) {
        const messages = [];
        const toolMessages = new Map();
        const activeParentToolUseIds = new Set();
        let idCounter = 0;
        let fallbackTimestamp = Date.now();
        let interruptionMessageAdded = false;
        const nextId = () => `qwen-${sessionId}-${++idCounter}`;
        const timestampFor = (update) => {
            const meta = toRecord(update._meta);
            const timestamp = asNumber(meta.timestamp) ?? asNumber(update.timestamp);
            if (timestamp != null)
                return timestamp;
            fallbackTimestamp += 1;
            return fallbackTimestamp;
        };
        const appendTextMessage = (role, text, timestamp, isIntermediate, intermediateKind, parentToolUseId) => {
            if (!text)
                return;
            const messageText = role === 'assistant' ? normalizeQwenAssistantText(text) : text;
            const previous = messages[messages.length - 1];
            if (previous &&
                previous.role === role &&
                previous.timestamp === timestamp &&
                !previous.toolUseId &&
                previous.isIntermediate === isIntermediate &&
                previous.intermediateKind === intermediateKind &&
                previous.parentToolUseId === parentToolUseId) {
                const nextContent = previous.content + text;
                previous.content =
                    role === 'assistant'
                        ? normalizeQwenAssistantText(nextContent)
                        : nextContent;
                return;
            }
            const content = messageText;
            messages.push({
                id: nextId(),
                role,
                content,
                timestamp,
                isIntermediate,
                intermediateKind,
                parentToolUseId,
            });
        };
        const appendInterruptionMessage = (timestamp) => {
            if (interruptionMessageAdded)
                return;
            interruptionMessageAdded = true;
            messages.push({
                id: nextId(),
                role: 'info',
                content: QWEN_RESPONSE_INTERRUPTED_MESSAGE,
                timestamp,
            });
        };
        const markTrailingAssistantAsCommentary = () => {
            const previous = messages[messages.length - 1];
            if (previous &&
                previous.role === 'assistant' &&
                !previous.toolUseId &&
                !previous.isIntermediate) {
                previous.isIntermediate = true;
                previous.intermediateKind = 'commentary';
            }
        };
        for (const update of updates) {
            const timestamp = timestampFor(update);
            const content = toRecord(update.content);
            const text = content.type === 'text' ? asString(content.text) : undefined;
            const parentToolUseId = resolveQwenParentToolUseId({
                update,
                activeParentToolUseIds,
            });
            switch (update.sessionUpdate) {
                case 'user_message_chunk':
                    appendTextMessage('user', text || '', timestamp);
                    break;
                case 'agent_message_chunk':
                    appendTextMessage('assistant', text || '', timestamp, undefined, undefined, parentToolUseId);
                    break;
                case 'agent_thought_chunk':
                    appendTextMessage('assistant', text || '', timestamp, true, 'thought', parentToolUseId);
                    break;
                case 'tool_call': {
                    markTrailingAssistantAsCommentary();
                    const toolUseId = asString(update.toolCallId) || `qwen-history-tool-${++idCounter}`;
                    const rawInput = toRecord(update.rawInput);
                    const meta = toRecord(update._meta);
                    const kind = asString(update.kind);
                    const toolName = normalizeToolName(asString(meta.toolName) || asString(update.title), kind);
                    const toolParentUseId = resolveQwenParentToolUseId({
                        update,
                        toolUseId,
                        activeParentToolUseIds,
                    });
                    const toolMessage = {
                        id: nextId(),
                        role: 'tool',
                        content: `Running ${toolName}...`,
                        timestamp,
                        toolName,
                        toolUseId,
                        toolInput: rawInput,
                        toolStatus: 'executing',
                        toolIntent: asString(update.title),
                        toolDisplayName: displayNameForTool(toolName, kind),
                        parentToolUseId: toolParentUseId,
                    };
                    messages.push(toolMessage);
                    toolMessages.set(toolUseId, toolMessage);
                    if (isParentTaskTool(toolName)) {
                        activeParentToolUseIds.add(toolUseId);
                    }
                    break;
                }
                case 'tool_call_update': {
                    markTrailingAssistantAsCommentary();
                    const toolUseId = asString(update.toolCallId) || `qwen-history-tool-${++idCounter}`;
                    const existing = toolMessages.get(toolUseId);
                    const meta = toRecord(update._meta);
                    const toolName = normalizeToolName(asString(meta.toolName) || existing?.toolName, asString(update.kind));
                    const toolParentUseId = resolveQwenParentToolUseId({
                        update,
                        toolUseId,
                        activeParentToolUseIds,
                    });
                    const result = this.formatToolResult(update);
                    const status = asString(update.status);
                    const isInterrupted = isQwenUserInterruptText(result) ||
                        isQwenUserInterruptStatus(status);
                    const isError = isQwenToolFailureStatus(status) || isInterrupted;
                    const toolResult = isInterrupted ? 'Interrupted' : result;
                    if (existing) {
                        existing.toolName = existing.toolName || toolName;
                        existing.toolResult = toolResult;
                        existing.toolStatus = isError ? 'error' : 'completed';
                        existing.isError = isError;
                        existing.parentToolUseId =
                            existing.parentToolUseId || toolParentUseId;
                    }
                    else {
                        const toolMessage = {
                            id: nextId(),
                            role: 'tool',
                            content: '',
                            timestamp,
                            toolName,
                            toolUseId,
                            toolResult,
                            toolStatus: isError ? 'error' : 'completed',
                            isError,
                            parentToolUseId: toolParentUseId,
                        };
                        messages.push(toolMessage);
                        toolMessages.set(toolUseId, toolMessage);
                    }
                    if (isParentTaskTool(toolName)) {
                        activeParentToolUseIds.delete(toolUseId);
                    }
                    if (isInterrupted) {
                        appendInterruptionMessage(timestamp);
                    }
                    break;
                }
                case 'plan': {
                    markTrailingAssistantAsCommentary();
                    const entries = Array.isArray(update.entries) ? update.entries : [];
                    const todos = entries
                        .filter(isRecord)
                        .map((entry) => ({
                        content: asString(entry.content) || '',
                        status: mapPlanStatus(entry.status),
                        activeForm: asString(entry.content) || '',
                    }))
                        .filter((todo) => todo.content);
                    messages.push({
                        id: nextId(),
                        role: 'tool',
                        content: 'Todo list updated',
                        timestamp,
                        toolName: 'TodoWrite',
                        toolUseId: `qwen-history-plan-${idCounter}`,
                        toolInput: { todos },
                        toolResult: 'Todo list updated',
                        toolStatus: 'completed',
                        toolDisplayName: 'Todo List Updated',
                    });
                    break;
                }
                default:
                    break;
            }
        }
        return messages;
    }
    mergeQwenTranscriptTelemetryMessages(sessionId, messages, cwd) {
        const transcriptMessages = this.loadQwenTranscriptTelemetryMessages(sessionId, cwd);
        if (transcriptMessages.length === 0)
            return messages;
        const messagesByToolUseId = new Map(messages
            .filter((message) => !!message.toolUseId)
            .map((message) => [message.toolUseId, message]));
        const additions = transcriptMessages.filter((candidate) => {
            const existingTool = candidate.toolUseId
                ? messagesByToolUseId.get(candidate.toolUseId)
                : undefined;
            if (existingTool) {
                existingTool.toolName = candidate.toolName || existingTool.toolName;
                existingTool.toolResult =
                    candidate.toolResult ?? existingTool.toolResult;
                existingTool.toolStatus =
                    candidate.toolStatus ?? existingTool.toolStatus;
                existingTool.isError = candidate.isError ?? existingTool.isError;
                existingTool.toolDisplayName =
                    candidate.toolDisplayName || existingTool.toolDisplayName;
                return false;
            }
            if (candidate.role !== 'tool' &&
                messages.some((message) => message.role === candidate.role &&
                    message.content === candidate.content &&
                    Math.abs(message.timestamp - candidate.timestamp) <= 1_000)) {
                return false;
            }
            return true;
        });
        if (additions.length === 0)
            return messages;
        return [...messages, ...additions]
            .map((message, index) => ({ message, index }))
            .sort((a, b) => {
            const timestampDelta = a.message.timestamp - b.message.timestamp;
            return timestampDelta !== 0 ? timestampDelta : a.index - b.index;
        })
            .map(({ message }) => message);
    }
    loadQwenTranscriptTelemetryMessages(sessionId, cwd) {
        const transcriptPath = getQwenTranscriptPath(sessionId, cwd);
        if (!existsSync(transcriptPath))
            return [];
        let fileContent;
        try {
            fileContent = readFileSync(transcriptPath, 'utf8');
        }
        catch (error) {
            this.debug(`Failed to read Qwen transcript telemetry from ${transcriptPath}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
        const messages = [];
        const toolMessages = new Map();
        const parentToolUseIdsBySubagent = new Map();
        const parentToolMessages = new Map();
        let fallbackParentToolUseId;
        let idCounter = 0;
        let interruptionMessageAdded = false;
        const nextId = () => `qwen-${sessionId}-transcript-${++idCounter}`;
        const appendInterruptionMessage = (timestamp) => {
            if (interruptionMessageAdded)
                return;
            interruptionMessageAdded = true;
            messages.push({
                id: nextId(),
                role: 'info',
                content: QWEN_RESPONSE_INTERRUPTED_MESSAGE,
                timestamp,
            });
        };
        const completeOpenParentTools = () => {
            for (const parent of parentToolMessages.values()) {
                if (parent.toolStatus !== 'executing')
                    continue;
                parent.toolStatus = 'completed';
                parent.toolResult = parent.toolResult ?? 'Completed';
            }
        };
        const failOpenNonParentTools = () => {
            for (const toolMessage of toolMessages.values()) {
                if (toolMessage.toolStatus !== 'executing')
                    continue;
                if (toolMessage.toolName && isParentTaskTool(toolMessage.toolName)) {
                    continue;
                }
                toolMessage.toolStatus = 'error';
                toolMessage.toolResult = QWEN_TOOL_RESULT_MISSING_MESSAGE;
                toolMessage.isError = true;
            }
        };
        for (const line of fileContent.split(/\r?\n/)) {
            if (!line.trim())
                continue;
            let record;
            try {
                record = JSON.parse(line);
            }
            catch {
                continue;
            }
            if (record.sessionId !== sessionId)
                continue;
            const timestamp = parseQwenTimestamp(record.timestamp) ?? Date.now();
            if (record.type === 'user') {
                completeOpenParentTools();
                const content = this.extractQwenRecordText(record);
                if (!content)
                    continue;
                messages.push({
                    id: nextId(),
                    role: 'user',
                    content,
                    timestamp,
                });
                continue;
            }
            if (record.type === 'assistant') {
                const message = toRecord(record.message);
                const parts = Array.isArray(message.parts)
                    ? message.parts.filter(isRecord)
                    : [];
                for (const part of parts) {
                    const text = asString(part.text);
                    if (text) {
                        const isThought = part.thought === true;
                        messages.push({
                            id: nextId(),
                            role: 'assistant',
                            content: isThought ? text : normalizeQwenAssistantText(text),
                            timestamp,
                            ...(isThought
                                ? {
                                    isIntermediate: true,
                                    intermediateKind: 'thought',
                                }
                                : {}),
                        });
                    }
                    const functionCall = toRecord(part.functionCall);
                    const functionName = asString(functionCall.name);
                    if (!functionName)
                        continue;
                    const toolName = normalizeToolName(functionName);
                    const toolUseId = asString(functionCall.id) || `qwen-transcript-tool-${++idCounter}`;
                    const rawInput = toRecord(functionCall.args);
                    const toolMessage = {
                        id: nextId(),
                        role: 'tool',
                        content: `Running ${toolName}...`,
                        timestamp,
                        toolName,
                        toolUseId,
                        toolInput: rawInput,
                        toolStatus: 'executing',
                        toolIntent: asString(rawInput.description),
                        toolDisplayName: displayNameForTool(toolName),
                    };
                    messages.push(toolMessage);
                    toolMessages.set(toolUseId, toolMessage);
                    if (isParentTaskTool(toolName)) {
                        fallbackParentToolUseId = toolUseId;
                        parentToolMessages.set(toolUseId, toolMessage);
                        const subagentType = asString(rawInput.subagent_type);
                        if (subagentType) {
                            parentToolUseIdsBySubagent.set(subagentType, toolUseId);
                        }
                    }
                }
                continue;
            }
            if (record.type === 'tool_result') {
                const result = this.extractQwenTranscriptToolResult(record);
                if (!result)
                    continue;
                const existing = result.callId
                    ? toolMessages.get(result.callId)
                    : undefined;
                const toolResult = result.isInterrupted
                    ? 'Interrupted'
                    : result.text || (result.isError ? 'Tool failed' : 'Tool completed');
                if (existing) {
                    existing.toolResult = toolResult;
                    existing.toolStatus = result.isError ? 'error' : 'completed';
                    existing.isError = result.isError;
                }
                else if (result.callId || result.toolName) {
                    const toolUseId = result.callId || `qwen-transcript-tool-${++idCounter}`;
                    const toolMessage = {
                        id: nextId(),
                        role: 'tool',
                        content: '',
                        timestamp,
                        toolName: result.toolName || 'tool',
                        toolUseId,
                        toolResult,
                        toolStatus: result.isError ? 'error' : 'completed',
                        toolDisplayName: displayNameForTool(result.toolName || 'tool'),
                        ...(result.isError ? { isError: true } : {}),
                    };
                    messages.push(toolMessage);
                    toolMessages.set(toolUseId, toolMessage);
                }
                if (result.isInterrupted) {
                    appendInterruptionMessage(timestamp);
                }
                continue;
            }
            if (record.type === 'system' && record.subtype === 'ui_telemetry') {
                const payload = toRecord(record.systemPayload);
                const uiEvent = toRecord(payload.uiEvent);
                if (uiEvent['event.name'] === 'qwen-code.api_error' &&
                    (isQwenUserInterruptText(asString(uiEvent.error_message)) ||
                        isQwenUserInterruptText(asString(uiEvent.error_type)))) {
                    appendInterruptionMessage(timestamp);
                    continue;
                }
            }
            const telemetryMessage = this.buildQwenTranscriptTelemetryMessage({
                record,
                timestamp,
                nextId,
                parentToolUseIdsBySubagent,
                fallbackParentToolUseId,
            });
            if (telemetryMessage) {
                const matchingTool = messages.findLast((message) => message.role === 'tool' &&
                    message.toolStatus === 'executing' &&
                    message.toolName === telemetryMessage.toolName &&
                    jsonStringify(message.toolInput ?? {}) ===
                        jsonStringify(telemetryMessage.toolInput ?? {}));
                if (matchingTool) {
                    matchingTool.toolResult = telemetryMessage.toolResult;
                    matchingTool.toolStatus = telemetryMessage.toolStatus;
                    matchingTool.isError = telemetryMessage.isError;
                }
                else {
                    messages.push(telemetryMessage);
                    if (telemetryMessage.toolUseId) {
                        toolMessages.set(telemetryMessage.toolUseId, telemetryMessage);
                    }
                }
            }
        }
        if (!(this._isProcessing && sessionId === this.qwenSessionId)) {
            completeOpenParentTools();
            failOpenNonParentTools();
        }
        return messages;
    }
    extractQwenTranscriptToolResult(record) {
        const result = toRecord(record.toolCallResult);
        const message = toRecord(record.message);
        const parts = Array.isArray(message.parts)
            ? message.parts.filter(isRecord)
            : [];
        for (const part of parts) {
            const functionResponse = toRecord(part.functionResponse);
            if (Object.keys(functionResponse).length === 0)
                continue;
            const response = toRecord(functionResponse.response);
            const text = asString(result.resultDisplay) || qwenFunctionResponseText(response);
            const status = asString(result.status);
            const responseError = asString(response.error);
            const isInterrupted = isQwenUserInterruptText(text) ||
                isQwenUserInterruptStatus(status) ||
                isQwenUserInterruptText(responseError);
            const isError = isInterrupted ||
                isQwenToolFailureStatus(status) ||
                responseError !== undefined;
            const callId = asString(functionResponse.id) || asString(result.callId);
            return {
                ...(callId ? { callId } : {}),
                toolName: normalizeToolName(asString(functionResponse.name)),
                ...(text ? { text } : {}),
                isError,
                isInterrupted,
            };
        }
        return undefined;
    }
    buildQwenTranscriptTelemetryMessage(args) {
        const { record, timestamp, nextId, parentToolUseIdsBySubagent } = args;
        if (record.type !== 'system' || record.subtype !== 'ui_telemetry') {
            return undefined;
        }
        const payload = toRecord(record.systemPayload);
        const uiEvent = toRecord(payload.uiEvent);
        if (uiEvent['event.name'] !== 'qwen-code.tool_call')
            return undefined;
        const toolName = normalizeToolName(asString(uiEvent.function_name));
        const toolUseId = asString(record.uuid) || `qwen-transcript-tool-${nextId()}`;
        const input = toRecord(uiEvent.function_args);
        const status = asString(uiEvent.status);
        const isInterrupted = isQwenUserInterruptStatus(status);
        const isError = uiEvent.success === false ||
            isQwenToolFailureStatus(status) ||
            isInterrupted;
        const error = asString(uiEvent.error);
        const contentLength = asNumber(uiEvent.content_length);
        const toolResult = isInterrupted
            ? 'Interrupted'
            : isError
                ? error || 'Tool failed'
                : contentLength != null
                    ? `Completed (${contentLength} bytes)`
                    : 'Completed';
        return {
            id: nextId(),
            role: 'tool',
            content: '',
            timestamp,
            toolName,
            toolUseId,
            toolInput: input,
            toolResult,
            toolStatus: isError ? 'error' : 'completed',
            toolDisplayName: displayNameForTool(toolName),
            parentToolUseId: this.resolveQwenTranscriptTelemetryParent(uiEvent, parentToolUseIdsBySubagent, args.fallbackParentToolUseId),
            ...(isError ? { isError } : {}),
        };
    }
    resolveQwenTranscriptTelemetryParent(uiEvent, parentToolUseIdsBySubagent, fallbackParentToolUseId) {
        const subagentName = asString(uiEvent.subagent_name);
        if (subagentName) {
            const parentToolUseId = parentToolUseIdsBySubagent.get(subagentName);
            if (parentToolUseId)
                return parentToolUseId;
        }
        const promptId = asString(uiEvent.prompt_id);
        const promptSubagentName = promptId?.match(/#([^#]+?)-[^#]+#/)?.[1];
        if (promptSubagentName) {
            const parentToolUseId = parentToolUseIdsBySubagent.get(promptSubagentName);
            if (parentToolUseId)
                return parentToolUseId;
        }
        return parentToolUseIdsBySubagent.size === 1
            ? [...parentToolUseIdsBySubagent.values()][0]
            : fallbackParentToolUseId;
    }
    mergeSlashCommandInvocationMessages(sessionId, messages, cwd) {
        const slashMessages = this.loadSlashCommandInvocationMessages(sessionId, cwd);
        if (slashMessages.length === 0)
            return messages;
        const additions = slashMessages.filter((slashMessage) => !messages.some((message) => this.isSameSlashCommandInvocationMessage(message, slashMessage)));
        if (additions.length === 0)
            return messages;
        return [...messages, ...additions]
            .map((message, index) => ({ message, index }))
            .sort((a, b) => {
            const timestampDelta = a.message.timestamp - b.message.timestamp;
            if (timestampDelta !== 0)
                return timestampDelta;
            if (a.message.role === 'user' && b.message.role !== 'user')
                return -1;
            if (a.message.role !== 'user' && b.message.role === 'user')
                return 1;
            return a.index - b.index;
        })
            .map(({ message }) => message);
    }
    isSameSlashCommandInvocationMessage(message, slashMessage) {
        const messageContent = message.role === 'assistant'
            ? normalizeQwenAssistantText(message.content).trim()
            : message.content.trim();
        return (message.role === slashMessage.role &&
            messageContent === slashMessage.content.trim() &&
            Math.abs(message.timestamp - slashMessage.timestamp) <= 10_000);
    }
    loadSlashCommandInvocationMessages(sessionId, cwd) {
        const transcriptPath = getQwenTranscriptPath(sessionId, cwd);
        if (!existsSync(transcriptPath))
            return [];
        const parentUuidByUuid = new Map();
        const userRecordUuids = new Set();
        const invocations = new Map();
        const seenResults = new Set();
        // An invocation pairs with at most one result, so a later same-name
        // orphan result cannot re-emit an already-paired invocation's user row.
        const consumedInvocations = new Set();
        const messages = [];
        let idCounter = 0;
        try {
            const lines = readFileSync(transcriptPath, 'utf8').split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                let record;
                try {
                    record = toRecord(JSON.parse(trimmed));
                }
                catch {
                    continue;
                }
                const uuid = asString(record.uuid);
                if (uuid) {
                    if (record.type === 'user')
                        userRecordUuids.add(uuid);
                    const parentUuidValue = asString(record.parentUuid);
                    if (parentUuidValue)
                        parentUuidByUuid.set(uuid, parentUuidValue);
                }
                if (record.type !== 'system' || record.subtype !== 'slash_command')
                    continue;
                const payload = toRecord(record.systemPayload);
                const rawCommand = asString(payload.rawCommand)?.trim();
                if (!rawCommand)
                    continue;
                const phase = asString(payload.phase);
                const timestamp = parseQwenTimestamp(record.timestamp) ?? Date.now();
                if (phase === 'invocation') {
                    if (uuid) {
                        invocations.set(uuid, {
                            rawCommand,
                            timestamp,
                            hidden: payload.hiddenInvocation === true,
                        });
                    }
                    continue;
                }
                if (phase !== 'result')
                    continue;
                const outputItems = Array.isArray(payload.outputHistoryItems)
                    ? payload.outputHistoryItems
                    : [];
                const outputTexts = outputItems
                    .filter(isRecord)
                    .map(formatQwenSlashOutputHistoryItem)
                    .filter((text) => !!text?.trim());
                if (outputTexts.length === 0)
                    continue;
                const parentUuid = asString(record.parentUuid);
                const resultKey = parentUuid || `${rawCommand}:${timestamp}`;
                if (seenResults.has(resultKey))
                    continue;
                seenResults.add(resultKey);
                let ancestorUuid = parentUuid;
                const visited = new Set();
                let invocation;
                let invocationUuid;
                const resultCommandName = rawCommand.split(/\s+/, 1)[0];
                while (ancestorUuid && !visited.has(ancestorUuid)) {
                    visited.add(ancestorUuid);
                    if (userRecordUuids.has(ancestorUuid))
                        break;
                    const candidate = invocations.get(ancestorUuid);
                    if (candidate) {
                        if (candidate.rawCommand.split(/\s+/, 1)[0] === resultCommandName &&
                            !consumedInvocations.has(ancestorUuid)) {
                            invocation = candidate;
                            invocationUuid = ancestorUuid;
                        }
                        break;
                    }
                    ancestorUuid = parentUuidByUuid.get(ancestorUuid);
                }
                if (invocation && invocationUuid) {
                    consumedInvocations.add(invocationUuid);
                    if (!invocation.hidden) {
                        messages.push({
                            id: `qwen-${sessionId}-slash-${++idCounter}`,
                            role: 'user',
                            content: invocation.rawCommand,
                            timestamp: invocation.timestamp,
                        });
                    }
                }
                messages.push({
                    id: `qwen-${sessionId}-slash-${++idCounter}`,
                    role: 'assistant',
                    content: outputTexts.join('\n\n'),
                    timestamp,
                });
            }
        }
        catch (error) {
            this.debug(`Failed to read Qwen slash command history from ${transcriptPath}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
        return messages;
    }
    handleAgentMessageChunk(update) {
        const content = toRecord(update.content);
        if (content.type !== 'text')
            return;
        const text = asString(content.text);
        if (!text)
            return;
        const parentToolUseId = resolveQwenParentToolUseId({
            update,
            activeParentToolUseIds: this.activeParentToolUseIds,
        });
        if (this.currentAssistantText &&
            this.currentAssistantParentToolUseId !== parentToolUseId) {
            this.flushAssistantText(true);
        }
        this.currentAssistantParentToolUseId = parentToolUseId;
        this.currentAssistantText += text;
        this.eventQueue.enqueue({
            type: 'text_delta',
            text,
            turnId: this.currentTurnId,
            parentToolUseId,
        });
    }
    handleAgentThoughtChunk(update) {
        const content = toRecord(update.content);
        if (content.type !== 'text')
            return;
        const text = asString(content.text);
        if (!text)
            return;
        const parentToolUseId = resolveQwenParentToolUseId({
            update,
            activeParentToolUseIds: this.activeParentToolUseIds,
        });
        if (this.currentThoughtText &&
            this.currentThoughtParentToolUseId !== parentToolUseId) {
            this.flushThoughtText();
        }
        this.currentThoughtParentToolUseId = parentToolUseId;
        this.currentThoughtText += text;
        this.eventQueue.enqueue({
            type: 'text_delta',
            text,
            turnId: this.currentTurnId,
            parentToolUseId,
        });
    }
    flushPendingTextAsIntermediate() {
        this.flushThoughtText();
        this.flushAssistantText(true);
    }
    flushThoughtText() {
        if (!this.currentThoughtText)
            return;
        this.eventQueue.enqueue({
            type: 'text_complete',
            text: this.currentThoughtText,
            isIntermediate: true,
            intermediateKind: 'thought',
            turnId: this.currentTurnId,
            parentToolUseId: this.currentThoughtParentToolUseId,
        });
        this.currentThoughtText = '';
        this.currentThoughtParentToolUseId = undefined;
    }
    flushAssistantText(isIntermediate) {
        if (!this.currentAssistantText)
            return;
        const text = normalizeQwenAssistantText(this.currentAssistantText, {
            forceJsonFence: this.currentIsSlashCommand,
        });
        this.eventQueue.enqueue({
            type: 'text_complete',
            text,
            ...(isIntermediate !== undefined ? { isIntermediate } : {}),
            ...(isIntermediate ? { intermediateKind: 'commentary' } : {}),
            turnId: this.currentTurnId,
            parentToolUseId: this.currentAssistantParentToolUseId,
        });
        this.currentAssistantText = '';
        this.currentAssistantParentToolUseId = undefined;
    }
    handleToolCall(update) {
        const toolUseId = asString(update.toolCallId) || `qwen-tool-${++this.toolIdCounter}`;
        const rawInput = toRecord(update.rawInput);
        const meta = toRecord(update._meta);
        const kind = asString(update.kind);
        const toolName = normalizeToolName(asString(meta.toolName) || asString(update.title), kind);
        const title = asString(update.title);
        const parentToolUseId = resolveQwenParentToolUseId({
            update,
            toolUseId,
            activeParentToolUseIds: this.activeParentToolUseIds,
        });
        this.toolNames.set(toolUseId, toolName);
        this.toolInputs.set(toolUseId, rawInput);
        this.eventQueue.enqueue({
            type: 'tool_start',
            toolName,
            toolUseId,
            input: rawInput,
            intent: title,
            displayName: displayNameForTool(toolName, kind),
            turnId: this.currentTurnId,
            parentToolUseId,
        });
        if (isParentTaskTool(toolName)) {
            this.activeParentToolUseIds.add(toolUseId);
        }
    }
    handleToolCallUpdate(update) {
        // Silent-shell liveness heartbeats arrive as in_progress frames with no
        // kind, carrying _meta.shellProgress, while the tool is still running;
        // converting one into a tool_result would prematurely complete the call
        // with an empty result. Match the web-shell normalizer's predicate
        // exactly — in_progress AND kind-absent AND shellProgress — so a
        // kind-bearing frame is never dropped here while the normalizer forwards
        // it (heartbeats emitted by the ACP session never carry a kind).
        const meta = toRecord(update._meta);
        if (asString(update.status) === 'in_progress' &&
            asString(update.kind) === undefined &&
            meta.shellProgress !== undefined) {
            return;
        }
        const toolUseId = asString(update.toolCallId) || `qwen-tool-${++this.toolIdCounter}`;
        const toolName = this.toolNames.get(toolUseId) ||
            normalizeToolName(asString(meta.toolName), asString(update.kind));
        const parentToolUseId = resolveQwenParentToolUseId({
            update,
            toolUseId,
            activeParentToolUseIds: this.activeParentToolUseIds,
        });
        const result = this.formatToolResult(update);
        const isError = update.status === 'failed';
        this.eventQueue.enqueue({
            type: 'tool_result',
            toolUseId,
            toolName,
            result,
            isError,
            input: this.toolInputs.get(toolUseId),
            turnId: this.currentTurnId,
            parentToolUseId,
        });
        if (isParentTaskTool(toolName)) {
            this.activeParentToolUseIds.delete(toolUseId);
        }
    }
    handlePlanUpdate(update) {
        const entries = Array.isArray(update.entries) ? update.entries : [];
        const todos = entries
            .filter(isRecord)
            .map((entry) => ({
            content: asString(entry.content) || '',
            status: mapPlanStatus(entry.status),
            activeForm: asString(entry.content) || '',
        }))
            .filter((todo) => todo.content);
        const toolUseId = `qwen-plan-${++this.planUpdateCounter}`;
        const input = { todos };
        this.eventQueue.enqueue({
            type: 'tool_start',
            toolName: 'TodoWrite',
            toolUseId,
            input,
            displayName: 'Todo List Updated',
            turnId: this.currentTurnId,
        });
        this.eventQueue.enqueue({
            type: 'tool_result',
            toolUseId,
            toolName: 'TodoWrite',
            result: 'Todo list updated',
            isError: false,
            input,
            turnId: this.currentTurnId,
        });
    }
    handleModeUpdate(update) {
        const modeId = asString(update.modeId) || asString(update.currentModeId);
        const mode = mapQwenModeToPermissionMode(modeId);
        if (!mode || mode === this.getPermissionMode())
            return;
        this.applyAcpPermissionMode(mode);
    }
    applyAcpPermissionMode(mode) {
        if (this.pendingModeOverride) {
            if (mode !== this.pendingModeOverride)
                return;
            this.pendingModeOverride = null;
        }
        if (mode === this.getPermissionMode())
            return;
        this.permissionManager.setPermissionMode(mode);
        this.onPermissionModeChange?.(mode);
    }
    parseAvailableCommandsUpdate(update) {
        const availableCommands = toAvailableSlashCommands(update.availableCommands);
        const meta = toRecord(update._meta);
        const availableSkillDetails = toAvailableSkillDetails(meta.availableSkillDetails);
        const availableSkills = toAvailableSkills(meta.availableSkills) ??
            availableSkillDetails?.map((skill) => skill.name);
        if (availableCommands.length === 0 &&
            (!availableSkills || availableSkills.length === 0)) {
            return null;
        }
        return {
            availableCommands,
            ...(availableSkills ? { availableSkills } : {}),
            ...(availableSkillDetails ? { availableSkillDetails } : {}),
        };
    }
    extractAvailableCommandsSnapshot(updates) {
        let latest = null;
        for (const update of updates) {
            if (update.sessionUpdate !== 'available_commands_update')
                continue;
            const snapshot = this.parseAvailableCommandsUpdate(update);
            if (snapshot)
                latest = snapshot;
        }
        if (latest) {
            this.latestAvailableCommandsSnapshot = latest;
            this.resolveAvailableCommandsWaiters(latest);
            this.debug(`Qwen loadSessionMessages captured available commands: commands=${latest.availableCommands.length} ` +
                `skills=${latest.availableSkills?.length ?? 0} ` +
                `skillDetails=${latest.availableSkillDetails?.length ?? 0} ` +
                `names=${formatDebugNames(latest.availableCommands.map((command) => command.name))} ` +
                `skillNames=${formatDebugNames(latest.availableSkills)}`);
        }
        return latest;
    }
    extractLatestTokenUsage(updates) {
        let latest = null;
        for (const update of updates) {
            const usage = this.extractUsage(update);
            if (usage)
                latest = usage;
        }
        if (!latest)
            return undefined;
        const outputTokens = latest.outputTokens ?? 0;
        const totalTokens = Math.max(latest.contextTokens, latest.inputTokens + outputTokens);
        const contextWindow = this.getCurrentModelContextWindow();
        return {
            inputTokens: latest.contextTokens,
            outputTokens,
            totalTokens,
            contextTokens: latest.contextTokens,
            costUsd: 0,
            ...(latest.cacheReadTokens !== undefined
                ? { cacheReadTokens: latest.cacheReadTokens }
                : {}),
            ...(latest.cacheCreationTokens !== undefined
                ? { cacheCreationTokens: latest.cacheCreationTokens }
                : {}),
            ...(contextWindow ? { contextWindow } : {}),
        };
    }
    handleAvailableCommandsUpdate(update) {
        const snapshot = this.parseAvailableCommandsUpdate(update);
        if (!snapshot) {
            this.debug('Qwen available_commands_update ignored because it contained no commands or skills');
            return;
        }
        this.debug(`Qwen available_commands_update parsed: commands=${snapshot.availableCommands.length} ` +
            `skills=${snapshot.availableSkills?.length ?? 0} ` +
            `skillDetails=${snapshot.availableSkillDetails?.length ?? 0} ` +
            `names=${formatDebugNames(snapshot.availableCommands.map((command) => command.name))} ` +
            `skillNames=${formatDebugNames(snapshot.availableSkills)}`);
        this.latestAvailableCommandsSnapshot = snapshot;
        this.resolveAvailableCommandsWaiters(snapshot);
        this.eventQueue.enqueue({
            type: 'available_commands_update',
            availableCommands: snapshot.availableCommands,
            availableSkills: snapshot.availableSkills,
            ...(snapshot.availableSkillDetails
                ? { availableSkillDetails: snapshot.availableSkillDetails }
                : {}),
        });
    }
    handleOrStoreAvailableCommandsUpdate(sessionId, update) {
        if (sessionId === this.qwenSessionId &&
            !this.suppressedSessionUpdates.has(sessionId)) {
            this.debug(`Qwen available_commands_update received for active session ${sessionId}`);
            this.handleAvailableCommandsUpdate(update);
            return;
        }
        this.debug(`Qwen available_commands_update buffered: updateSession=${sessionId} ` +
            `currentSession=${this.qwenSessionId ?? 'none'} ` +
            `suppressed=${this.suppressedSessionUpdates.has(sessionId)}`);
        this.pendingAvailableCommandsUpdates.set(sessionId, update);
    }
    flushPendingAvailableCommandsUpdate(sessionId) {
        const update = this.pendingAvailableCommandsUpdates.get(sessionId);
        if (!update)
            return;
        this.pendingAvailableCommandsUpdates.delete(sessionId);
        this.debug(`Qwen available_commands_update flushing buffered update for session ${sessionId}`);
        this.handleAvailableCommandsUpdate(update);
    }
    waitForAvailableCommandsSnapshot(timeoutMs = 2_000) {
        if (this.latestAvailableCommandsSnapshot) {
            return Promise.resolve(this.latestAvailableCommandsSnapshot);
        }
        return new Promise((resolve) => {
            let settled = false;
            const waiter = (snapshot) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeout);
                this.availableCommandsWaiters = this.availableCommandsWaiters.filter((item) => item !== waiter);
                resolve(snapshot);
            };
            const timeout = setTimeout(() => {
                this.debug(`Qwen slash command refresh wait timed out after ${timeoutMs}ms`);
                waiter(null);
            }, timeoutMs);
            this.availableCommandsWaiters.push(waiter);
        });
    }
    resolveAvailableCommandsWaiters(snapshot) {
        const waiters = this.availableCommandsWaiters.splice(0);
        if (waiters.length > 0) {
            this.debug(`Qwen resolving ${waiters.length} slash command refresh waiter(s)`);
        }
        for (const resolve of waiters) {
            resolve(snapshot);
        }
    }
    formatToolResult(update) {
        const content = Array.isArray(update.content) ? update.content : [];
        const parts = [];
        for (const item of content) {
            if (!isRecord(item))
                continue;
            if (item.type === 'content') {
                const inner = toRecord(item.content);
                if (inner.type === 'text' && typeof inner.text === 'string') {
                    parts.push(inner.text);
                }
                else {
                    parts.push(jsonStringify(inner));
                }
            }
            else if (item.type === 'diff') {
                const path = asString(item.path) || 'file';
                parts.push(`Updated ${path}`);
            }
            else if (item.type === 'terminal') {
                parts.push(jsonStringify(item));
            }
        }
        if (parts.length > 0)
            return parts.join('\n\n');
        if ('rawOutput' in update)
            return typeof update.rawOutput === 'string'
                ? update.rawOutput
                : jsonStringify(update.rawOutput);
        return update.status === 'failed' ? 'Tool failed' : 'Tool completed';
    }
    captureUsage(update) {
        const usage = this.extractUsage(update);
        if (!usage)
            return;
        const contextWindow = this.getCurrentModelContextWindow();
        this.capturedUsageInCurrentTurn = true;
        this.resolveUsageWaiters();
        this.eventQueue.enqueue({
            type: 'usage_update',
            usage: {
                inputTokens: usage.contextTokens,
                ...(contextWindow ? { contextWindow } : {}),
            },
        });
    }
    captureUsageInto(collector, update) {
        const usage = this.extractUsage(update);
        if (!usage)
            return;
        collector.inputTokens = usage.inputTokens;
        collector.outputTokens = usage.outputTokens;
    }
    extractUsage(update) {
        const meta = toRecord(update._meta);
        const usage = firstRecord(meta.usage, meta.usageMetadata, update.usage, update.usageMetadata);
        if (Object.keys(usage).length === 0)
            return null;
        const inputTokens = asNumber(usage.inputTokens) ??
            asNumber(usage.promptTokens) ??
            asNumber(usage.promptTokenCount);
        const outputTokens = asNumber(usage.outputTokens) ??
            asNumber(usage.completionTokens) ??
            asNumber(usage.candidatesTokenCount);
        const totalTokens = asNumber(usage.totalTokens) ?? asNumber(usage.totalTokenCount);
        const contextTokens = totalTokens ?? inputTokens;
        if (contextTokens === undefined)
            return null;
        const cacheReadTokens = asNumber(usage.cacheReadTokens) ??
            asNumber(usage.cachedReadTokens) ??
            asNumber(usage.cachedContentTokenCount);
        const cacheCreationTokens = asNumber(usage.cacheCreationTokens) ??
            asNumber(usage.cachedCreationTokens);
        return {
            inputTokens: inputTokens ?? contextTokens,
            contextTokens,
            outputTokens,
            ...(cacheReadTokens !== undefined ? { cacheReadTokens } : {}),
            ...(cacheCreationTokens !== undefined ? { cacheCreationTokens } : {}),
        };
    }
    // ============================================================
    // Permissions
    // ============================================================
    handlePermissionRequest(params) {
        const record = toRecord(params);
        const toolCall = toRecord(record.toolCall);
        const options = Array.isArray(record.options)
            ? record.options.filter(isRecord)
            : [];
        const kind = asString(toolCall.kind);
        const rawInput = toRecord(toolCall.rawInput);
        const title = asString(toolCall.title) || 'Qwen Code requests permission';
        const toolName = normalizeToolName(asString(toRecord(toolCall._meta).toolName) || title, kind);
        const command = asString(rawInput.command) || asString(rawInput.cmd);
        const questions = parseAskUserQuestions(rawInput.questions);
        const isAskUserQuestion = toolName === 'ask_user_question' || !!questions;
        const metadata = isRecord(rawInput.metadata)
            ? { source: asString(rawInput.metadata.source) }
            : undefined;
        if (!this.onPermissionRequest) {
            const autoAllow = this.getPermissionMode() === 'allow-all';
            return Promise.resolve(this.createPermissionResponse(options, autoAllow, autoAllow));
        }
        return new Promise((resolve) => {
            const requestId = `qwen-permission-${++this.permissionRequestCounter}`;
            const timeout = setTimeout(() => {
                this.respondToPermission(requestId, false);
            }, PERMISSION_REQUEST_TIMEOUT_MS);
            this.pendingPermissions.set(requestId, { resolve, options, timeout });
            try {
                this.onPermissionRequest?.({
                    requestId,
                    toolName,
                    command,
                    description: title,
                    type: isAskUserQuestion
                        ? 'ask_user_question'
                        : permissionTypeForKind(kind),
                    reason: asString(rawInput.reason),
                    impact: this.permissionImpact(toolCall),
                    questions,
                    metadata,
                });
            }
            catch (error) {
                this.debug(`Qwen permission callback failed: ${error instanceof Error ? error.message : String(error)}`);
                this.respondToPermission(requestId, false);
            }
        });
    }
    permissionImpact(toolCall) {
        const content = Array.isArray(toolCall.content) ? toolCall.content : [];
        for (const item of content) {
            if (!isRecord(item))
                continue;
            if (item.type === 'diff') {
                return `Will modify ${asString(item.path) || 'a file'}`;
            }
            if (item.type === 'content') {
                const inner = toRecord(item.content);
                const text = asString(inner.text);
                if (text)
                    return text.slice(0, 500);
            }
        }
        return undefined;
    }
    selectPermissionOption(options, alwaysAllow) {
        if (alwaysAllow) {
            const always = options.find((option) => option.kind === 'allow_always' || option.optionId?.includes('always'));
            if (always?.optionId)
                return always.optionId;
        }
        const once = options.find((option) => option.optionId === 'proceed_once' || option.kind === 'allow_once');
        if (once?.optionId)
            return once.optionId;
        const firstAllow = options.find((option) => option.kind !== 'reject_once' && option.optionId);
        return firstAllow?.optionId || 'proceed_once';
    }
    createPermissionResponse(options, allowed, alwaysAllow, answers) {
        if (!allowed) {
            return { outcome: { outcome: 'cancelled' } };
        }
        return {
            outcome: {
                outcome: 'selected',
                optionId: this.selectPermissionOption(options, alwaysAllow),
            },
            ...(answers ? { answers } : {}),
        };
    }
    cancelPendingPermissions() {
        for (const requestId of this.pendingPermissions.keys()) {
            this.respondToPermission(requestId, false);
        }
    }
    resolvePendingPermission(requestId, response) {
        const pending = this.pendingPermissions.get(requestId);
        if (!pending)
            return;
        clearTimeout(pending.timeout);
        this.pendingPermissions.delete(requestId);
        pending.resolve(response);
    }
    debug(message) {
        this.onDebug?.(`[QwenAgent] ${message}`);
    }
}
export { QwenAgent as QwenBackend };
//# sourceMappingURL=qwen-agent.js.map