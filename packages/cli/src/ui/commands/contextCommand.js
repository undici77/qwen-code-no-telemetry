/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommandKind, } from './types.js';
import { MessageType, } from '../types.js';
import { DiscoveredMCPTool, uiTelemetryService, getCoreSystemPrompt, resolveInteractionMode, DEFAULT_TOKEN_LIMIT, ToolNames, buildSkillLlmContent, computeThresholds, } from '@qwen-code/qwen-code-core';
import { t } from '../../i18n/index.js';
/**
 * Classify a token count against the three-tier compaction ladder. Mirrors
 * the gating logic in `chatCompressionService` / `geminiChat` so the
 * `/context` output's "current tier" label reflects exactly which tier the
 * runtime would treat the session as sitting in.
 */
function currentTier(tokens, thresholds) {
    if (tokens >= thresholds.hard)
        return 'hard';
    if (tokens >= thresholds.auto)
        return 'auto';
    if (tokens >= thresholds.warn)
        return 'warn';
    return 'safe';
}
/**
 * Estimate token count for a string using a character-based heuristic.
 * ASCII chars ≈ 4 chars/token, CJK/non-ASCII chars ≈ 1.5 tokens/char.
 */
function estimateTokens(text) {
    if (!text || text.length === 0)
        return 0;
    let asciiChars = 0;
    let nonAsciiChars = 0;
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode < 128) {
            asciiChars++;
        }
        else {
            nonAsciiChars++;
        }
    }
    // CJK and other non-ASCII characters typically produce 1.5-2 tokens each
    return Math.ceil(asciiChars / 4 + nonAsciiChars * 1.5);
}
/**
 * Parse concatenated memory content into individual file entries.
 * Memory content format: "--- Context from: <path> ---\n<content>\n--- End of Context from: <path> ---"
 */
function parseMemoryFiles(memoryContent) {
    if (!memoryContent || memoryContent.trim().length === 0)
        return [];
    const results = [];
    // Use backreference (\1) to ensure start/end path markers match
    const regex = /--- Context from: (.+?) ---\n([\s\S]*?)--- End of Context from: \1 ---/g;
    let match;
    while ((match = regex.exec(memoryContent)) !== null) {
        const filePath = match[1];
        const content = match[2];
        results.push({
            path: filePath,
            tokens: estimateTokens(content),
        });
    }
    // If no structured markers found, treat as a single memory block
    if (results.length === 0 && memoryContent.trim().length > 0) {
        results.push({
            path: t('memory'),
            tokens: estimateTokens(memoryContent),
        });
    }
    return results;
}
export async function collectContextData(config, showDetails) {
    const modelName = config.getModel() || 'unknown';
    const contentGeneratorConfig = config.getContentGeneratorConfig();
    const contextWindowSize = contentGeneratorConfig.contextWindowSize ?? DEFAULT_TOKEN_LIMIT;
    // Prefer the per-session chat's API-reported count. `uiTelemetryService` is
    // a process-global singleton shared by every session in a `serve` daemon, so
    // reading it here reports whichever session most recently completed a turn
    // (#5763). The active chat carries the correct per-session value; fall back
    // to the global singleton only when no chat exists yet (first /context,
    // --continue resume before any send).
    const geminiClient = config.getGeminiClient?.();
    const activeChat = geminiClient?.isInitialized?.()
        ? geminiClient.getChat()
        : undefined;
    const apiTotalTokens = activeChat
        ? activeChat.getLastPromptTokenCount()
        : uiTelemetryService.getLastPromptTokenCount();
    // Cached-content tokens have no per-chat mirror today (only the global
    // singleton is written, geminiChat.ts), so this read stays global. It only
    // refines the messages-vs-cache split, not the headline total or tier.
    const apiCachedTokens = uiTelemetryService.getLastCachedContentTokenCount();
    const systemPromptText = getCoreSystemPrompt(undefined, modelName, undefined, resolveInteractionMode(config));
    const systemPromptTokens = estimateTokens(systemPromptText);
    const toolRegistry = config.getToolRegistry();
    const allTools = toolRegistry ? toolRegistry.getAllTools() : [];
    // Match what's actually sent to the model: deferred tools — MCP tools and
    // low-frequency built-ins like web_fetch / monitor / cron_* — are absent
    // from the prompt unless ToolSearch has revealed them this session. See
    // client.ts which calls getFunctionDeclarations() with no args. The
    // per-tool loop below applies the same filter so allToolsTokens stays
    // aligned with the breakdown sum.
    const toolDeclarations = toolRegistry
        ? toolRegistry.getFunctionDeclarations()
        : [];
    const toolsJsonStr = JSON.stringify(toolDeclarations);
    const allToolsTokens = estimateTokens(toolsJsonStr);
    const builtinTools = [];
    const mcpTools = [];
    for (const tool of allTools) {
        if (toolRegistry?.isDeferredAndHidden(tool.name)) {
            continue;
        }
        const toolJsonStr = JSON.stringify(tool.schema);
        const tokens = estimateTokens(toolJsonStr);
        if (tool instanceof DiscoveredMCPTool) {
            mcpTools.push({
                name: `${tool.serverName}__${tool.serverToolName || tool.name}`,
                tokens,
            });
        }
        else if (tool.name !== ToolNames.SKILL) {
            builtinTools.push({
                name: tool.name,
                tokens,
            });
        }
    }
    const memoryContent = config.getUserMemory();
    const memoryFiles = parseMemoryFiles(memoryContent);
    const autoMemoryPrompt = config.getAutoMemoryPrompt();
    if (autoMemoryPrompt) {
        memoryFiles.push({
            path: t('auto memory'),
            tokens: estimateTokens(autoMemoryPrompt),
        });
    }
    const memoryFilesTokens = memoryFiles.reduce((sum, f) => sum + f.tokens, 0);
    const skillTool = allTools.find((tool) => tool.name === ToolNames.SKILL);
    const skillToolDefinitionTokens = skillTool
        ? estimateTokens(JSON.stringify(skillTool.schema))
        : 0;
    const loadedSkillNames = skillTool && 'getLoadedSkillNames' in skillTool
        ? skillTool.getLoadedSkillNames()
        : new Set();
    const skillManager = config.getSkillManager();
    const skillConfigs = skillManager ? await skillManager.listSkills() : [];
    let loadedBodiesTokens = 0;
    const skills = skillConfigs.map((skill) => {
        const listingTokens = estimateTokens(`<skill>\n<name>\n${skill.name}\n</name>\n<description>\n${skill.description} (${skill.level})\n</description>\n<location>\n${skill.level}\n</location>\n</skill>`);
        const isLoaded = loadedSkillNames.has(skill.name);
        let bodyTokens;
        if (isLoaded && skill.body) {
            const baseDir = skill.filePath
                ? skill.filePath.replace(/\/[^/]+$/, '')
                : '';
            bodyTokens = estimateTokens(buildSkillLlmContent(baseDir, skill.body));
            loadedBodiesTokens += bodyTokens;
        }
        return {
            name: skill.name,
            tokens: listingTokens,
            loaded: isLoaded,
            bodyTokens,
        };
    });
    const skillsTokens = skillToolDefinitionTokens + loadedBodiesTokens;
    const thresholds = computeThresholds(contextWindowSize, config.getAutoCompactThreshold());
    // Keep the `(window - auto)` buffer for the legacy three-segment progress
    // bar in ContextUsage.tsx — it visualizes the headroom between the auto
    // threshold and the window edge, which is exactly `contextWindowSize -
    // thresholds.auto`. New consumers should read `breakdown.thresholds`
    // directly.
    const autocompactBuffer = Math.max(0, Math.round(contextWindowSize - thresholds.auto));
    const rawOverhead = systemPromptTokens +
        allToolsTokens +
        memoryFilesTokens +
        loadedBodiesTokens;
    const hasTokenCount = apiTotalTokens > 0;
    const isEstimated = !hasTokenCount || activeChat?.isLastPromptTokenCountEstimated() === true;
    const mcpToolsTotalTokens = mcpTools.reduce((sum, tool) => sum + tool.tokens, 0);
    let totalTokens;
    let displaySystemPrompt;
    let displayBuiltinTools;
    let displayMcpTools;
    let displayMemoryFiles;
    let displaySkills;
    let messagesTokens;
    let freeSpace;
    let detailBuiltinTools;
    let detailMcpTools;
    let detailMemoryFiles;
    let detailSkills;
    if (!hasTokenCount) {
        totalTokens = 0;
        displaySystemPrompt = systemPromptTokens;
        displaySkills = skillsTokens;
        displayBuiltinTools = Math.max(0, allToolsTokens - skillToolDefinitionTokens - mcpToolsTotalTokens);
        displayMcpTools = mcpToolsTotalTokens;
        displayMemoryFiles = memoryFilesTokens;
        messagesTokens = 0;
        freeSpace = Math.max(0, contextWindowSize - rawOverhead - autocompactBuffer);
        detailBuiltinTools = builtinTools;
        detailMcpTools = mcpTools;
        detailMemoryFiles = memoryFiles;
        detailSkills = skills;
    }
    else {
        totalTokens = apiTotalTokens;
        const overheadScale = rawOverhead > totalTokens ? totalTokens / rawOverhead : 1;
        displaySystemPrompt = Math.round(systemPromptTokens * overheadScale);
        const scaledAllTools = Math.round(allToolsTokens * overheadScale);
        displayMemoryFiles = Math.round(memoryFilesTokens * overheadScale);
        displaySkills = Math.round(skillsTokens * overheadScale);
        const scaledMcpTotal = Math.round(mcpToolsTotalTokens * overheadScale);
        displayMcpTools = scaledMcpTotal;
        const scaledSkillDefinition = Math.round(skillToolDefinitionTokens * overheadScale);
        displayBuiltinTools = Math.max(0, scaledAllTools - scaledSkillDefinition - scaledMcpTotal);
        const scaledOverhead = displaySystemPrompt +
            scaledAllTools +
            displayMemoryFiles +
            Math.round(loadedBodiesTokens * overheadScale);
        if (apiCachedTokens > 0) {
            messagesTokens = Math.max(0, totalTokens - apiCachedTokens);
        }
        else {
            messagesTokens = Math.max(0, totalTokens - scaledOverhead);
        }
        freeSpace = Math.max(0, contextWindowSize - totalTokens - autocompactBuffer);
        const scaleDetail = (items) => overheadScale < 1
            ? items.map((item) => ({
                ...item,
                tokens: Math.round(item.tokens * overheadScale),
            }))
            : items;
        detailBuiltinTools = scaleDetail(builtinTools);
        detailMcpTools = scaleDetail(mcpTools);
        detailMemoryFiles = scaleDetail(memoryFiles);
        detailSkills =
            overheadScale < 1
                ? skills.map((item) => ({
                    ...item,
                    tokens: Math.round(item.tokens * overheadScale),
                    bodyTokens: item.bodyTokens
                        ? Math.round(item.bodyTokens * overheadScale)
                        : undefined,
                }))
                : skills;
    }
    // Tier classification: prefer the API-reported total when available.
    // When no API call has happened yet (first /context, --continue resume,
    // sub-agent inheritance), classify against `rawOverhead` so a session
    // dominated by system prompt / skills / MCP tools doesn't silently show
    // "safe". (R2.2)
    //
    // SCOPE GAP (R5.1): `rawOverhead` excludes `messagesTokens` — the actual
    // chat history. A `--continue` restore with 100K of historical messages
    // (but small overhead) will still display "safe" here, even though the
    // cheap-gate inside chatCompressionService will trigger compression on
    // the very next send (it uses `estimatePromptTokens(history, ...)` which
    // walks the real history). This is a UI/runtime divergence — for a
    // single render — that resolves the moment any send happens.
    //
    // TODO: plumb the chat history into collectContextData and use
    // estimatePromptTokens(history, undefined, 0, 0, imageTokenEstimate) here
    // for same-source-of-truth as the cheap-gate. Defer because Config
    // doesn't expose the active chat instance today.
    const tierTokens = hasTokenCount ? apiTotalTokens : rawOverhead;
    const breakdown = {
        systemPrompt: displaySystemPrompt,
        builtinTools: displayBuiltinTools,
        mcpTools: displayMcpTools,
        memoryFiles: displayMemoryFiles,
        skills: displaySkills,
        messages: messagesTokens,
        freeSpace,
        autocompactBuffer,
        thresholds,
        currentTier: currentTier(tierTokens, thresholds),
    };
    return {
        type: MessageType.CONTEXT_USAGE,
        modelName,
        totalTokens,
        contextWindowSize,
        breakdown,
        builtinTools: showDetails ? detailBuiltinTools : [],
        mcpTools: showDetails ? detailMcpTools : [],
        memoryFiles: showDetails ? detailMemoryFiles : [],
        skills: showDetails ? detailSkills : [],
        isEstimated,
        showDetails,
    };
}
/**
 * Format token count for display (e.g. 1234 -> "1.2k", 123456 -> "123.5k")
 */
function fmtTokens(tokens) {
    if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(1)}k`;
    }
    return `${tokens}`;
}
/**
 * Format a category row as text: "  label .............. 1.2k tokens (3.4%)"
 */
function fmtCategoryRow(label, tokens, contextWindowSize, indent = '  ') {
    const percentage = contextWindowSize > 0
        ? ((tokens / contextWindowSize) * 100).toFixed(1)
        : '0.0';
    const right = `${fmtTokens(tokens)} tokens (${percentage}%)`;
    const leftPart = `${indent}${label}`;
    const totalWidth = 56;
    const dots = Math.max(1, totalWidth - leftPart.length - right.length);
    return `${leftPart}${' '.repeat(dots)}${right}`;
}
/** Locale-grouped integer (e.g. 147000 -> "147,000"). */
function formatNum(n) {
    return Math.round(n).toLocaleString('en-US');
}
/**
 * Convert a HistoryItemContextUsage to a human-readable text string,
 * mirroring the layout of the interactive ContextUsage component.
 */
export function formatContextUsageText(data) {
    const { modelName, totalTokens, contextWindowSize, breakdown, builtinTools, mcpTools, memoryFiles, skills, isEstimated, showDetails, } = data;
    const hasTokenCount = totalTokens > 0;
    const lines = [];
    lines.push('## Context Usage');
    lines.push('');
    if (!hasTokenCount) {
        lines.push('*No API response yet. Send a message to see actual usage.*');
        lines.push('');
        lines.push('**Estimated pre-conversation overhead**');
        lines.push(`Model: ${modelName}  Context window: ${fmtTokens(contextWindowSize)} tokens`);
        lines.push('');
    }
    else {
        lines.push(`Model: ${modelName}  Context window: ${fmtTokens(contextWindowSize)} tokens`);
        lines.push('');
        if (isEstimated) {
            lines.push('*Token usage is estimated until provider usage is received.*');
            lines.push('');
        }
        lines.push(fmtCategoryRow('Used', totalTokens, contextWindowSize));
        lines.push(fmtCategoryRow('Free', breakdown.freeSpace, contextWindowSize));
        lines.push('');
        lines.push('**Compaction thresholds**');
        lines.push(`  Effective window:   ${formatNum(breakdown.thresholds.effectiveWindow)}  (window − ${formatNum(contextWindowSize - breakdown.thresholds.effectiveWindow)} reserve)`);
        lines.push(`  Warn threshold:     ${formatNum(breakdown.thresholds.warn)}`);
        lines.push(`  Auto threshold:     ${formatNum(breakdown.thresholds.auto)}`);
        lines.push(`  Hard threshold:     ${formatNum(breakdown.thresholds.hard)}`);
        lines.push(`  Current tier:       ${breakdown.currentTier}`);
        lines.push('');
        lines.push('**Usage by category**');
    }
    lines.push(fmtCategoryRow('System prompt', breakdown.systemPrompt, contextWindowSize));
    lines.push(fmtCategoryRow('Built-in tools', breakdown.builtinTools, contextWindowSize));
    if (breakdown.mcpTools > 0) {
        lines.push(fmtCategoryRow('MCP tools', breakdown.mcpTools, contextWindowSize));
    }
    lines.push(fmtCategoryRow('Memory files', breakdown.memoryFiles, contextWindowSize));
    lines.push(fmtCategoryRow('Skills', breakdown.skills, contextWindowSize));
    if (hasTokenCount) {
        lines.push(fmtCategoryRow('Messages', breakdown.messages, contextWindowSize));
    }
    if (showDetails) {
        const sortedBuiltin = [...builtinTools].sort((a, b) => b.tokens - a.tokens);
        const sortedMcp = [...mcpTools].sort((a, b) => b.tokens - a.tokens);
        const sortedMemory = [...memoryFiles].sort((a, b) => b.tokens - a.tokens);
        const sortedSkills = [...skills].sort((a, b) => {
            if (a.loaded !== b.loaded)
                return a.loaded ? -1 : 1;
            return b.tokens + (b.bodyTokens ?? 0) - (a.tokens + (a.bodyTokens ?? 0));
        });
        if (sortedBuiltin.length > 0) {
            lines.push('');
            lines.push('**Built-in tools**');
            for (const tool of sortedBuiltin) {
                lines.push(fmtCategoryRow(tool.name, tool.tokens, contextWindowSize, '  └ '));
            }
        }
        if (sortedMcp.length > 0) {
            lines.push('');
            lines.push('**MCP tools**');
            for (const tool of sortedMcp) {
                lines.push(fmtCategoryRow(tool.name, tool.tokens, contextWindowSize, '  └ '));
            }
        }
        if (sortedMemory.length > 0) {
            lines.push('');
            lines.push('**Memory files**');
            for (const file of sortedMemory) {
                lines.push(fmtCategoryRow(file.path, file.tokens, contextWindowSize, '  └ '));
            }
        }
        if (sortedSkills.length > 0) {
            lines.push('');
            lines.push('**Skills**');
            for (const skill of sortedSkills) {
                const label = skill.loaded ? `${skill.name} (active)` : skill.name;
                lines.push(fmtCategoryRow(label, skill.tokens, contextWindowSize, '  └ '));
                if (skill.loaded && skill.bodyTokens && skill.bodyTokens > 0) {
                    lines.push(fmtCategoryRow('body loaded', skill.bodyTokens, contextWindowSize, '    └ '));
                }
            }
        }
    }
    else {
        lines.push('');
        lines.push('*Run /context detail for per-item breakdown.*');
    }
    return lines.join('\n');
}
export const contextCommand = {
    name: 'context',
    get description() {
        return t('Show context window usage breakdown. Use "/context detail" for per-item breakdown.');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive', 'non_interactive', 'acp'],
    action: async (context, args) => {
        const normalizedArgs = args?.trim().toLowerCase();
        const showDetails = normalizedArgs === 'detail' || normalizedArgs === '-d';
        const executionMode = context.executionMode ?? 'interactive';
        const { config } = context.services;
        if (!config) {
            if (executionMode === 'interactive') {
                context.ui.addItem({
                    type: MessageType.ERROR,
                    text: t('Config not loaded.'),
                }, Date.now());
                return;
            }
            return {
                type: 'message',
                messageType: 'error',
                content: t('Config not loaded.'),
            };
        }
        const contextUsageItem = await collectContextData(config, showDetails);
        if (executionMode === 'interactive') {
            context.ui.addItem(contextUsageItem, Date.now());
            return;
        }
        return {
            type: 'message',
            messageType: 'info',
            content: formatContextUsageText(contextUsageItem),
        };
    },
    subCommands: [
        {
            name: 'detail',
            get description() {
                return t('Show per-item context usage breakdown.');
            },
            kind: CommandKind.BUILT_IN,
            supportedModes: ['interactive', 'non_interactive', 'acp'],
            action: async (context) => {
                // Delegate to main action with 'detail' arg to show detailed view
                await contextCommand.action(context, 'detail');
            },
        },
    ],
};
//# sourceMappingURL=contextCommand.js.map