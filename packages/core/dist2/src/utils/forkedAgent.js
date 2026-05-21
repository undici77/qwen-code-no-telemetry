/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { runWithRuntimeContentGenerator, } from '../agents/runtime/agent-context.js';
import { ApprovalMode } from '../config/config.js';
import { GeminiChat, StreamEventType } from '../core/geminiChat.js';
import { createRuntimeContentGeneratorView } from '../models/content-generator-config.js';
import { createApprovalModeOverride } from '../tools/agent/agent.js';
import { AgentHeadless, AgentEventEmitter, AgentEventType, AgentTerminateMode, ContextState, } from '../agents/index.js';
import { buildModelIdContext, resolveModelId, } from './modelId.js';
// Module-level slot written after each successful main turn.
let currentCacheSafeParams = null;
let currentVersion = 0;
/**
 * Save cache-safe params after a successful main conversation turn.
 * Called from GeminiClient.sendMessageStream() on successful completion.
 */
export function saveCacheSafeParams(generationConfig, history, model) {
    const prevConfig = currentCacheSafeParams?.generationConfig;
    const sysChanged = !prevConfig ||
        JSON.stringify(prevConfig.systemInstruction) !==
            JSON.stringify(generationConfig.systemInstruction);
    const toolsChanged = !prevConfig ||
        JSON.stringify(prevConfig.tools) !== JSON.stringify(generationConfig.tools);
    if (sysChanged || toolsChanged) {
        currentVersion++;
    }
    currentCacheSafeParams = {
        generationConfig: structuredClone(generationConfig),
        history,
        model,
        version: currentVersion,
    };
}
/**
 * Get the current cache-safe params, or null if not yet captured.
 */
export function getCacheSafeParams() {
    return currentCacheSafeParams
        ? structuredClone(currentCacheSafeParams)
        : null;
}
/**
 * Clear cache-safe params (e.g., on session reset).
 */
export function clearCacheSafeParams() {
    currentCacheSafeParams = null;
}
// ---------------------------------------------------------------------------
// Forked chat — shared by runForkedAgent (cache path) and speculation
// ---------------------------------------------------------------------------
/** Per-request config that strips tools so the model never produces function calls. */
const NO_TOOLS = Object.freeze({ tools: [] });
/**
 * Create an isolated GeminiChat that shares the main conversation's
 * generationConfig (including systemInstruction, tools, and history).
 *
 * Used by runForkedAgent (cache path) and directly by speculation.ts which
 * needs its own multi-turn tool-execution loop with OverlayFs interception.
 */
export function createForkedChat(config, params) {
    const maxHistoryEntries = 40;
    const history = params.history.length > maxHistoryEntries
        ? params.history.slice(-maxHistoryEntries)
        : params.history;
    return new GeminiChat(config, {
        ...params.generationConfig,
        // Disable thinking for forked queries — no reasoning tokens needed,
        // and it doesn't affect the cache prefix.
        thinkingConfig: { includeThoughts: false },
    }, [...history], undefined, // no chatRecordingService
    undefined);
}
async function buildForkedModelRuntime(base, contentGeneratorOwner, modelSelector) {
    const resolvedModel = resolveModelId(modelSelector, buildModelIdContext(base));
    // When the selector cannot resolve (e.g. `fast` with no fast model
    // configured, or `inherit` on a config without a current model), fall back
    // to the parent session model instead of passing the raw selector string
    // to the provider. Matches the subagent path, where an unresolvable
    // selector means "inherit parent".
    const model = resolvedModel?.modelId ?? base.getModel();
    const runtimeView = await buildForkedRuntimeContentGeneratorView(base, contentGeneratorOwner, resolvedModel);
    return { model, runtimeView };
}
async function buildForkedRuntimeContentGeneratorView(base, contentGeneratorOwner, resolvedModel) {
    if (!resolvedModel?.authType)
        return undefined;
    const currentContentGeneratorConfig = base.getContentGeneratorConfig?.();
    const currentAuthType = currentContentGeneratorConfig?.authType;
    const currentModel = currentContentGeneratorConfig?.model ?? base.getModel?.();
    if (resolvedModel.authType === currentAuthType &&
        resolvedModel.modelId === currentModel) {
        return undefined;
    }
    return createRuntimeContentGeneratorView(base, contentGeneratorOwner, resolvedModel.modelId, { authType: resolvedModel.authType });
}
function runWithForkedModelRuntime(runtime, fn) {
    const run = () => fn(runtime.model);
    return runtime.runtimeView
        ? runWithRuntimeContentGenerator(runtime.runtimeView, run)
        : run();
}
/**
 * Run a direct forked-chat loop under the runtime view required by the
 * selected model. This is used by speculation, which owns its own multi-turn
 * loop instead of going through runForkedAgent().
 */
export async function runWithForkedChatModel(config, modelSelector, fn) {
    const runtime = await buildForkedModelRuntime(config, config, modelSelector);
    return runWithForkedModelRuntime(runtime, fn);
}
function extractQueryUsage(metadata) {
    return {
        inputTokens: metadata?.promptTokenCount ?? 0,
        outputTokens: metadata?.candidatesTokenCount ?? 0,
        cacheHitTokens: metadata?.cachedContentTokenCount ?? 0,
    };
}
/**
 * Extracts file paths from a tool call's args object.
 * Matches any arg key that contains "path", "file", or "target".
 */
function extractFilePathsFromArgs(args) {
    const matches = new Set();
    const visit = (value, key) => {
        if (typeof value === 'string') {
            const normalizedKey = key?.toLowerCase() ?? '';
            if (normalizedKey.includes('path') ||
                normalizedKey.includes('file') ||
                normalizedKey.includes('target')) {
                matches.add(value);
            }
            return;
        }
        if (Array.isArray(value)) {
            for (const item of value)
                visit(item, key);
            return;
        }
        if (value && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                visit(v, k);
            }
        }
    };
    visit(args);
    return [...matches];
}
export async function runForkedAgent(params) {
    // ── Cache path ────────────────────────────────────────────────────────────
    if ('cacheSafeParams' in params) {
        const { config, userMessage, cacheSafeParams, jsonSchema, abortSignal } = params;
        const modelSelector = params.model ?? cacheSafeParams.model;
        const modelRuntime = await buildForkedModelRuntime(config, config, modelSelector);
        return runWithForkedModelRuntime(modelRuntime, async (model) => {
            const chat = createForkedChat(config, cacheSafeParams);
            const requestConfig = { ...NO_TOOLS };
            if (abortSignal)
                requestConfig.abortSignal = abortSignal;
            if (jsonSchema) {
                requestConfig.responseMimeType = 'application/json';
                requestConfig.responseJsonSchema = jsonSchema;
            }
            const stream = await chat.sendMessageStream(model, { message: [{ text: userMessage }], config: requestConfig }, 'forked_query');
            let fullText = '';
            let usage = {
                inputTokens: 0,
                outputTokens: 0,
                cacheHitTokens: 0,
            };
            for await (const event of stream) {
                if (event.type !== StreamEventType.CHUNK)
                    continue;
                const response = event.value;
                const text = response.candidates?.[0]?.content?.parts
                    ?.filter((p) => !p['thought'])
                    .map((p) => p.text ?? '')
                    .join('');
                if (text)
                    fullText += text;
                if (response.usageMetadata)
                    usage = extractQueryUsage(response.usageMetadata);
            }
            const trimmed = fullText.trim() || null;
            let jsonResult;
            if (jsonSchema && trimmed) {
                try {
                    jsonResult = JSON.parse(trimmed);
                }
                catch {
                    // non-JSON response despite schema constraint — treat as text
                }
            }
            return { text: trimmed, jsonResult, usage };
        });
    }
    // ── AgentHeadless path ────────────────────────────────────────────────────
    // `createApprovalModeOverride` rebuilds the tool registry on the YOLO
    // wrapper Config so core file tools (`EditTool` / `WriteFileTool` /
    // `ReadFileTool`) resolve `this.config` to the wrapper, not to the
    // parent. Without that rebuild the YOLO override is silently ignored
    // on the bound-tool path (parent's pre-bound tool instances keep
    // reading the parent's approval mode), and the wrapper's own
    // `FileReadCache` lazy-init is bypassed too.
    //
    // Consumers that pre-wrap with `createMemoryScopedAgentConfig`
    // (memory extraction / dream agent) compose correctly: the YOLO
    // wrapper's bound tools resolve `this.config.getPermissionManager()`
    // through the prototype chain to the scoped wrapper's own override,
    // while `this.config.getApprovalMode()` lands on YOLO.
    const { config: yoloConfig, cleanup: restoreParentPM } = await createApprovalModeOverride(params.config, ApprovalMode.YOLO);
    // YOLO never triggers strip → restoreParentPM is a no-op. Kept for
    // API symmetry with the other createApprovalModeOverride callers; if
    // this function ever switches away from YOLO the lifecycle stays
    // correct without further refactor.
    const filesTouched = new Set();
    const emitter = new AgentEventEmitter();
    emitter.on(AgentEventType.TOOL_CALL, (event) => {
        for (const filePath of extractFilePathsFromArgs(event.args)) {
            filesTouched.add(filePath);
        }
    });
    const promptConfig = {
        systemPrompt: params.systemPrompt,
        initialMessages: params.extraHistory,
    };
    const modelSelector = params.model ?? params.config.getFastModel?.() ?? params.config.getModel();
    const modelRuntime = await buildForkedModelRuntime(params.config, yoloConfig, modelSelector);
    const modelConfig = {
        model: modelRuntime.model,
    };
    const runConfig = {
        max_turns: params.maxTurns,
        max_time_minutes: params.maxTimeMinutes,
    };
    const toolConfig = params.tools !== undefined ? { tools: params.tools } : undefined;
    try {
        const headless = await AgentHeadless.create(params.name, yoloConfig, promptConfig, modelConfig, runConfig, toolConfig, emitter, undefined, modelRuntime.runtimeView);
        const context = new ContextState();
        context.set('task_prompt', params.taskPrompt);
        await runWithForkedModelRuntime(modelRuntime, async () => {
            await headless.execute(context, params.abortSignal);
        });
        const terminateReason = headless.getTerminateMode();
        const finalText = headless.getFinalText() || undefined;
        const touched = [...filesTouched];
        if (terminateReason === AgentTerminateMode.CANCELLED) {
            return {
                status: 'cancelled',
                terminateReason,
                finalText,
                filesTouched: touched,
            };
        }
        if (terminateReason === AgentTerminateMode.ERROR ||
            terminateReason === AgentTerminateMode.TIMEOUT) {
            return {
                status: 'failed',
                terminateReason,
                finalText,
                filesTouched: touched,
            };
        }
        return {
            status: 'completed',
            terminateReason,
            finalText,
            filesTouched: touched,
        };
    }
    finally {
        // Release the per-fork ToolRegistry so AgentTool / SkillTool
        // instances dispose their change-listeners on shared
        // SubagentManager / SkillManager. Same shape as the spawn-path
        // finallys in `agent.ts` and `background-agent-resume.ts`.
        void yoloConfig
            .getToolRegistry()
            .stop()
            .catch(() => { });
        restoreParentPM();
    }
}
//# sourceMappingURL=forkedAgent.js.map