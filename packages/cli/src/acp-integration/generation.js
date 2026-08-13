/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Stateless, tool-free generation for the daemon request-scoped SSE endpoint.
 * It deliberately bypasses GeminiChat so neither history nor recording is
 * read or mutated.
 */
import { getResponseText } from '@qwen-code/qwen-code-core';
export const GENERATION_MAX_PROMPT_BYTES = 32 * 1024;
export const GENERATION_TIMEOUT_MS = 60_000;
export async function executeGeneration(config, requestId, prompt, signal, emit) {
    const fastModel = config.getFastModel();
    const mainModel = config.getModel();
    const client = config.getBaseLlmClient();
    let modelSource = fastModel ? 'fast' : 'main';
    let resolved;
    if (fastModel) {
        try {
            resolved = await client.resolveForModel(fastModel, { failClosed: true });
        }
        catch {
            modelSource = 'main';
        }
    }
    resolved ??= await client.resolveForModel(mainModel, { failClosed: true });
    const { contentGenerator, model } = resolved;
    await emit({ type: 'started', model, modelSource });
    const stream = await contentGenerator.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            abortSignal: signal,
            tools: [],
            thinkingConfig: { thinkingBudget: 0, includeThoughts: false },
            temperature: 0.2,
        },
    }, `generation:${requestId}`);
    let seq = 0;
    let thinkingEmitted = false;
    let usage;
    for await (const chunk of stream) {
        if (!thinkingEmitted &&
            chunk.candidates?.some((candidate) => candidate.content?.parts?.some((part) => part.thought === true))) {
            thinkingEmitted = true;
            await emit({ type: 'thinking' });
        }
        const text = getResponseText(chunk) ?? '';
        if (text) {
            await emit({ type: 'delta', seq: seq++, text });
        }
        if (chunk.usageMetadata)
            usage = chunk.usageMetadata;
    }
    return {
        model,
        modelSource,
        ...(usage?.promptTokenCount !== undefined
            ? { inputTokens: usage.promptTokenCount }
            : {}),
        ...(usage?.candidatesTokenCount !== undefined
            ? { outputTokens: usage.candidatesTokenCount }
            : {}),
    };
}
//# sourceMappingURL=generation.js.map