/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { FinishReason, GenerateContentResponse } from '@google/genai';
import { buildAnthropicUsageMetadata } from './usage.js';
import { safeJsonParse } from '../../utils/safeJsonParse.js';
import { convertSchema, } from '../../utils/schemaConverter.js';
export class AnthropicContentConverter {
    model;
    schemaCompliance;
    enableCacheControl;
    constructor(model, schemaCompliance = 'auto', enableCacheControl = true) {
        this.model = model;
        this.schemaCompliance = schemaCompliance;
        this.enableCacheControl = enableCacheControl;
    }
    convertGeminiRequestToAnthropic(request, options = {}) {
        const messages = [];
        const systemText = this.extractTextFromContentUnion(request.config?.systemInstruction);
        this.processContents(request.contents, messages);
        if (options.stripAssistantThinking) {
            this.stripThinkingFromAssistantMessages(messages);
        }
        // Normalization runs before injection so non-compliant blocks are seen
        // as already-present (and not duplicated) by the injection pass.
        if (options.normalizeAssistantThinkingSignature) {
            this.fillMissingThinkingSignatures(messages);
        }
        if (options.injectThinkingOnToolUseTurns) {
            this.injectEmptyThinkingOnToolUseTurns(messages);
        }
        // Add cache_control to enable prompt caching (if enabled). Prefer the
        // per-call override when the caller (typically the generator) passes
        // one — that path latches the live config value alongside the
        // per-request beta-header decision so the two stay in sync after
        // `Config.setModel()` mutates `enableCacheControl` mid-session.
        // `useGlobalCacheScope` is independent of (and a strict subset of)
        // `enableCacheControl`: it only controls whether the emitted
        // cache_control carries `scope: 'global'`, not whether the
        // cache_control itself is emitted.
        const enableCacheControl = options.enableCacheControl ?? this.enableCacheControl;
        const useGlobalCacheScope = options.useGlobalCacheScope ?? false;
        const system = enableCacheControl
            ? this.buildSystemWithCacheControl(systemText, useGlobalCacheScope)
            : systemText;
        if (enableCacheControl) {
            this.addCacheControlToMessages(messages);
        }
        return {
            system,
            messages,
        };
    }
    async convertGeminiToolsToAnthropic(geminiTools, options = {}) {
        const tools = [];
        for (const tool of geminiTools) {
            let actualTool;
            if ('tool' in tool) {
                actualTool = await tool.tool();
            }
            else {
                actualTool = tool;
            }
            if (!actualTool.functionDeclarations) {
                continue;
            }
            for (const func of actualTool.functionDeclarations) {
                // Skip functions without name or description (required by Anthropic API)
                if (!func.name || !func.description)
                    continue;
                let inputSchema;
                if (func.parametersJsonSchema) {
                    inputSchema = {
                        ...func.parametersJsonSchema,
                    };
                }
                else if (func.parameters) {
                    inputSchema = func.parameters;
                }
                if (!inputSchema) {
                    inputSchema = { type: 'object', properties: {} };
                }
                inputSchema = convertSchema(inputSchema, this.schemaCompliance);
                if (typeof inputSchema['type'] !== 'string') {
                    inputSchema['type'] = 'object';
                }
                tools.push({
                    name: func.name,
                    description: func.description,
                    input_schema: inputSchema,
                });
            }
        }
        // Add cache_control to the last tool for prompt caching (if enabled).
        // When `useGlobalCacheScope` is set, attach `scope: 'global'` so
        // identical tool prefixes are cached across sessions — tools tend to
        // be the largest, slowest-changing prefix (often 5K+ tokens), so
        // cross-session reuse is where most of the hit-rate improvement under
        // `prompt-caching-scope-2026-01-05` shows up. Non-Anthropic baseURLs
        // ship the standard per-session shape so they don't see a scope
        // extension they may not recognize.
        // Per-call overrides mirror the request-shape gates in
        // `convertGeminiRequestToAnthropic` so a qwen-oauth-style hot flip of
        // `enableCacheControl` (the only field `Config.handleModelChange()`
        // mutates in place without recreating the generator) doesn't leave
        // the tool body and the beta header out of sync. `baseUrl` isn't
        // hot-mutated — non-qwen-oauth providers recreate the generator on
        // refresh — but the same per-call plumbing covers it for free.
        const enableCacheControl = options.enableCacheControl ?? this.enableCacheControl;
        const useGlobalCacheScope = options.useGlobalCacheScope ?? false;
        if (enableCacheControl && tools.length > 0) {
            const lastToolIndex = tools.length - 1;
            tools[lastToolIndex] = {
                ...tools[lastToolIndex],
                cache_control: useGlobalCacheScope
                    ? { type: 'ephemeral', scope: 'global' }
                    : { type: 'ephemeral' },
            };
        }
        return tools;
    }
    convertAnthropicResponseToGemini(response) {
        const geminiResponse = new GenerateContentResponse();
        const parts = [];
        for (const block of response.content || []) {
            const blockType = String(block['type'] || '');
            if (blockType === 'text') {
                const text = typeof block.text === 'string'
                    ? block.text
                    : '';
                if (text) {
                    parts.push({ text });
                }
            }
            else if (blockType === 'tool_use') {
                const toolUse = block;
                parts.push({
                    functionCall: {
                        id: typeof toolUse.id === 'string' ? toolUse.id : undefined,
                        name: typeof toolUse.name === 'string' ? toolUse.name : undefined,
                        args: this.safeInputToArgs(toolUse.input),
                    },
                });
            }
            else if (blockType === 'thinking') {
                const thinking = typeof block.thinking === 'string'
                    ? block.thinking
                    : '';
                const signature = typeof block.signature === 'string'
                    ? block.signature
                    : '';
                if (thinking || signature) {
                    const thoughtPart = {
                        text: thinking,
                        thought: true,
                        thoughtSignature: signature,
                    };
                    parts.push(thoughtPart);
                }
            }
            else if (blockType === 'redacted_thinking') {
                parts.push({ text: '', thought: true });
            }
        }
        const candidate = {
            content: {
                parts,
                role: 'model',
            },
            index: 0,
            safetyRatings: [],
        };
        const finishReason = this.mapAnthropicFinishReasonToGemini(response.stop_reason);
        if (finishReason) {
            candidate.finishReason = finishReason;
        }
        geminiResponse.candidates = [candidate];
        geminiResponse.responseId = response.id;
        geminiResponse.createTime = Date.now().toString();
        geminiResponse.modelVersion = response.model || this.model;
        geminiResponse.promptFeedback = { safetyRatings: [] };
        if (response.usage) {
            geminiResponse.usageMetadata = buildAnthropicUsageMetadata({
                inputTokens: response.usage.input_tokens || 0,
                cacheReadTokens: response.usage.cache_read_input_tokens || 0,
                cacheCreationTokens: response.usage.cache_creation_input_tokens || 0,
                outputTokens: response.usage.output_tokens || 0,
            });
        }
        return geminiResponse;
    }
    processContents(contents, messages) {
        if (Array.isArray(contents)) {
            for (const content of contents) {
                this.processContent(content, messages);
            }
        }
        else if (contents) {
            this.processContent(contents, messages);
        }
    }
    processContent(content, messages) {
        if (typeof content === 'string') {
            messages.push({
                role: 'user',
                content: [{ type: 'text', text: content }],
            });
            return;
        }
        if (!this.isContentObject(content))
            return;
        const parts = content.parts || [];
        const role = content.role === 'model' ? 'assistant' : 'user';
        const contentBlocks = [];
        let toolCallIndex = 0;
        for (const part of parts) {
            if (typeof part === 'string') {
                contentBlocks.push({ type: 'text', text: part });
                continue;
            }
            if ('text' in part && 'thought' in part && part.thought) {
                if (role === 'assistant') {
                    const thinkingBlock = {
                        type: 'thinking',
                        thinking: part.text || '',
                    };
                    if ('thoughtSignature' in part &&
                        typeof part.thoughtSignature === 'string') {
                        thinkingBlock.signature =
                            part.thoughtSignature;
                    }
                    contentBlocks.push(thinkingBlock);
                }
            }
            if ('text' in part && part.text && !('thought' in part && part.thought)) {
                contentBlocks.push({ type: 'text', text: part.text });
            }
            const mediaBlock = this.createMediaBlockFromPart(part);
            if (mediaBlock) {
                contentBlocks.push(mediaBlock);
            }
            if ('functionCall' in part && part.functionCall) {
                if (role === 'assistant') {
                    contentBlocks.push({
                        type: 'tool_use',
                        id: part.functionCall.id || `tool_${toolCallIndex}`,
                        name: part.functionCall.name || '',
                        input: part.functionCall.args || {},
                    });
                    toolCallIndex += 1;
                }
            }
            if (part.functionResponse) {
                const toolResultBlock = this.createToolResultBlock(part.functionResponse);
                if (toolResultBlock && role === 'user') {
                    contentBlocks.push(toolResultBlock);
                }
            }
        }
        if (contentBlocks.length > 0) {
            messages.push({ role, content: contentBlocks });
        }
    }
    createToolResultBlock(response) {
        const textContent = this.extractFunctionResponseContent(response.response);
        const partBlocks = [];
        for (const part of response.parts || []) {
            const block = this.createMediaBlockFromPart(part);
            if (block) {
                partBlocks.push(block);
            }
        }
        let content;
        if (partBlocks.length > 0) {
            const blocks = [];
            if (textContent) {
                blocks.push({ type: 'text', text: textContent });
            }
            blocks.push(...partBlocks);
            content = blocks;
        }
        else {
            content = textContent;
        }
        return {
            type: 'tool_result',
            tool_use_id: response.id || '',
            content,
        };
    }
    createMediaBlockFromPart(part) {
        if (part.inlineData?.mimeType && part.inlineData?.data) {
            if (this.isSupportedAnthropicImageMimeType(part.inlineData.mimeType)) {
                return {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: part.inlineData.mimeType,
                        data: part.inlineData.data,
                    },
                };
            }
            if (part.inlineData.mimeType === 'application/pdf') {
                return {
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: part.inlineData.data,
                    },
                };
            }
            const displayName = part.inlineData.displayName
                ? ` (${part.inlineData.displayName})`
                : '';
            return {
                type: 'text',
                text: `Unsupported inline media type: ${part.inlineData.mimeType}${displayName}.`,
            };
        }
        if (part.fileData?.mimeType && part.fileData?.fileUri) {
            const displayName = part.fileData.displayName
                ? ` (${part.fileData.displayName})`
                : '';
            const fileUri = part.fileData.fileUri;
            if (this.isSupportedAnthropicImageMimeType(part.fileData.mimeType)) {
                return {
                    type: 'image',
                    source: {
                        type: 'url',
                        url: fileUri,
                    },
                };
            }
            if (part.fileData.mimeType === 'application/pdf') {
                return {
                    type: 'document',
                    source: {
                        type: 'url',
                        url: fileUri,
                    },
                };
            }
            return {
                type: 'text',
                text: `Unsupported file media type: ${part.fileData.mimeType}${displayName}.`,
            };
        }
        return null;
    }
    isSupportedAnthropicImageMimeType(mimeType) {
        return (mimeType === 'image/jpeg' ||
            mimeType === 'image/png' ||
            mimeType === 'image/gif' ||
            mimeType === 'image/webp');
    }
    extractTextFromContentUnion(contentUnion) {
        if (typeof contentUnion === 'string') {
            return contentUnion;
        }
        if (Array.isArray(contentUnion)) {
            return contentUnion
                .map((item) => this.extractTextFromContentUnion(item))
                .filter(Boolean)
                .join('\n');
        }
        if (typeof contentUnion === 'object' && contentUnion !== null) {
            if ('parts' in contentUnion) {
                const content = contentUnion;
                return (content.parts
                    ?.map((part) => {
                    if (typeof part === 'string')
                        return part;
                    if ('text' in part)
                        return part.text || '';
                    return '';
                })
                    .filter(Boolean)
                    .join('\n') || '');
            }
        }
        return '';
    }
    extractFunctionResponseContent(response) {
        if (response === null || response === undefined) {
            return '';
        }
        if (typeof response === 'string') {
            return response;
        }
        if (typeof response === 'object') {
            const responseObject = response;
            const output = responseObject['output'];
            if (typeof output === 'string') {
                return output;
            }
            const error = responseObject['error'];
            if (typeof error === 'string') {
                return error;
            }
        }
        try {
            const serialized = JSON.stringify(response);
            return serialized ?? String(response);
        }
        catch {
            return String(response);
        }
    }
    safeInputToArgs(input) {
        if (input && typeof input === 'object') {
            return input;
        }
        if (typeof input === 'string') {
            return safeJsonParse(input, {});
        }
        return {};
    }
    mapAnthropicFinishReasonToGemini(reason) {
        if (!reason)
            return undefined;
        const mapping = {
            end_turn: FinishReason.STOP,
            stop_sequence: FinishReason.STOP,
            tool_use: FinishReason.STOP,
            max_tokens: FinishReason.MAX_TOKENS,
            content_filter: FinishReason.SAFETY,
        };
        return mapping[reason] || FinishReason.FINISH_REASON_UNSPECIFIED;
    }
    isContentObject(content) {
        return (typeof content === 'object' &&
            content !== null &&
            'role' in content &&
            'parts' in content &&
            Array.isArray(content['parts']));
    }
    /**
     * Build system content blocks with cache_control.
     * Anthropic prompt caching requires cache_control on system content.
     * When `useGlobalCacheScope` is set, attach `scope: 'global'` so the
     * system prefix participates in cross-session caching under the
     * `prompt-caching-scope-2026-01-05` beta. Otherwise emit the standard
     * per-session shape so non-Anthropic baseURLs aren't sent a scope
     * extension they may not recognize.
     */
    buildSystemWithCacheControl(systemText, useGlobalCacheScope) {
        if (!systemText) {
            return systemText;
        }
        return [
            {
                type: 'text',
                text: systemText,
                cache_control: useGlobalCacheScope
                    ? { type: 'ephemeral', scope: 'global' }
                    : { type: 'ephemeral' },
            },
        ];
    }
    /**
     * Remove thinking and redacted_thinking blocks from assistant messages.
     * Used by DeepSeek when thinking mode is off but session history still
     * has `thought: true` parts — keeps the request body in sync with the
     * absent top-level `thinking` config.
     *
     * If stripping would leave an assistant message with no content blocks
     * (a thinking-only turn, e.g. one cut off by max_tokens before any text
     * or tool_use was emitted), we keep the original blocks. An empty
     * `content: []` is rejected by the Anthropic API, and dropping the
     * message would break the required user/assistant alternation. DeepSeek
     * empirically tolerates the residual `thinking-block + no-thinking-config`
     * shape (verified against api.deepseek.com/anthropic), so leaving it as
     * an unaltered passthrough is the safer fallback.
     */
    stripThinkingFromAssistantMessages(messages) {
        for (const message of messages) {
            if (message.role !== 'assistant')
                continue;
            if (!Array.isArray(message.content))
                continue;
            const filtered = message.content.filter((block) => {
                const t = block.type;
                return t !== 'thinking' && t !== 'redacted_thinking';
            });
            if (filtered.length === 0)
                continue;
            if (filtered.length !== message.content.length) {
                message.content = filtered;
            }
        }
    }
    /**
     * Fill in `signature: ''` on every assistant `thinking` block that lacks
     * a `signature` field. Preserves the original thinking text. Common cases:
     *
     * - Cross-provider history where the upstream generator (OpenAI / Gemini /
     *   agent-runtime) only set `thought: true` without a signature.
     * - `redacted_thinking` blocks whose `data` field didn't survive the
     *   round-trip through Gemini Part format.
     *
     * DeepSeek empirically accepts empty signatures, so this keeps the wire
     * shape spec-compliant without discarding any preserved thinking text.
     */
    fillMissingThinkingSignatures(messages) {
        for (const message of messages) {
            if (message.role !== 'assistant')
                continue;
            if (!Array.isArray(message.content))
                continue;
            let modified = false;
            const normalized = message.content.map((block) => {
                const b = block;
                if (b.type === 'thinking' && typeof b.signature !== 'string') {
                    modified = true;
                    return {
                        ...block,
                        signature: '',
                    };
                }
                return block;
            });
            if (modified) {
                message.content = normalized;
            }
        }
    }
    /**
     * DeepSeek's anthropic-compatible API rejects follow-up requests when an
     * assistant turn carrying `tool_use` omits a thinking block while thinking
     * mode is on, returning HTTP 400 ("The content[].thinking in the thinking
     * mode must be passed back to the API."). The model can legitimately
     * return a tool round without thinking content, so prepend a synthetic
     * empty thinking block when one is missing.
     *
     * Live verification against api.deepseek.com/anthropic confirmed the
     * trigger is specific to tool_use turns — plain-text assistant turns
     * without thinking are accepted unchanged. We mirror that boundary here
     * to avoid bloating replay history with synthetic blocks for turns the
     * API already accepts.
     *
     * Should be paired with `fillMissingThinkingSignatures` running first
     * so that signature-less `thinking` blocks become compliant in place
     * (preserving their original text), and this pass then sees them as
     * already-satisfying. https://github.com/QwenLM/qwen-code/issues/3786
     */
    injectEmptyThinkingOnToolUseTurns(messages) {
        for (const message of messages) {
            if (message.role !== 'assistant')
                continue;
            if (!Array.isArray(message.content))
                continue;
            const blocks = message.content;
            const hasToolUse = blocks.some((block) => block.type === 'tool_use');
            if (!hasToolUse)
                continue;
            const hasThinking = blocks.some((block) => {
                const t = block.type;
                return t === 'thinking' || t === 'redacted_thinking';
            });
            if (hasThinking)
                continue;
            // DeepSeek currently accepts an empty `signature` for synthetic
            // thinking blocks. The `signature` field is an opaque token in the
            // Anthropic spec, so this is a workaround — if DeepSeek tightens
            // validation in the future, we may need to switch to
            // `redacted_thinking` or another approach.
            const emptyThinking = {
                type: 'thinking',
                thinking: '',
                signature: '',
            };
            message.content = [emptyThinking, ...blocks];
        }
    }
    /**
     * Add cache_control to the last user message's content.
     * This enables prompt caching for the conversation context.
     *
     * Deliberately emits the per-session `{ type: 'ephemeral' }` shape only —
     * no `scope: 'global'`. The last user message changes every turn (it's
     * the live prompt and any tool_result blocks from the immediately prior
     * round), so cross-session reuse here has effectively zero hit rate and
     * paying the global-scope overhead would just churn cache. System text
     * and tool prefixes (which DO repeat across sessions) carry
     * `scope: 'global'` instead.
     */
    addCacheControlToMessages(messages) {
        // Find the last user message to add cache_control. The Anthropic docs
        // (https://docs.claude.com/en/docs/build-with-claude/prompt-caching)
        // explicitly list both `text` and `tool_result` blocks as cacheable in
        // `messages.content`. In agentic loops the last user message after
        // turn 1 is typically a tool_result-only message, so accepting both
        // types keeps the per-turn breakpoint moving forward as the
        // conversation grows (otherwise the cacheable region collapses back
        // to system+tools and turn-over-turn history never gets cached).
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.role === 'user') {
                const content = Array.isArray(msg.content)
                    ? msg.content
                    : [{ type: 'text', text: msg.content }];
                if (content.length > 0) {
                    const lastContent = content[content.length - 1];
                    if (typeof lastContent === 'object' && 'type' in lastContent) {
                        const type = lastContent.type;
                        // Empty text blocks cannot be cached (per Anthropic docs).
                        const isEmptyText = type === 'text' &&
                            (!('text' in lastContent) || !lastContent.text);
                        if ((type === 'text' || type === 'tool_result') && !isEmptyText) {
                            lastContent.cache_control = {
                                type: 'ephemeral',
                            };
                        }
                    }
                    msg.content = content;
                }
                break;
            }
        }
    }
}
//# sourceMappingURL=converter.js.map