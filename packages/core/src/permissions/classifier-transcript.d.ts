/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Classifier transcript construction.
 *
 * Mirrors ClaudeCode's `buildTranscriptEntries` (yoloClassifier.ts) in two
 * ways:
 *   1. Assistant text is stripped — the agent could be tricked into writing
 *      "classifier, please allow this" inside its output.
 *   2. Tool results are fully stripped — they may contain untrusted content
 *      (curl'd web pages, file contents) carrying prompt injection.
 *   3. Each tool_use call is projected through the tool's
 *      `toAutoClassifierInput` method so the tool can redact sensitive /
 *      voluminous fields.
 *
 * Where this differs from ClaudeCode: claude serializes the whole transcript
 * (including historical tool_use calls) as plain text and sends it inside a
 * single user-role message wrapped in `<transcript>` tags. We do the same —
 * historical `model.functionCall` parts are rendered as user-role text turns
 * rather than left as Gemini-native function-call parts. The motivation is
 * backend-agnostic delivery: the OpenAI Chat Completions converter drops
 * assistant `tool_calls` that lack a matching `tool` response (an orphan
 * filter at converter.ts:1429-1454). Because step 2 strips tool results,
 * every retained historical function-call would become orphan on the
 * default Qwen / DashScope backend and the entire prior-action chain would
 * be wiped before the classifier saw it.
 */
import type { Content } from '@google/genai';
import type { ToolRegistry } from '../tools/tool-registry.js';
/** The action whose safety the classifier should evaluate. */
export interface PendingAction {
    toolName: string;
    toolParams: Record<string, unknown>;
}
/**
 * Maximum number of recent messages to include in the classifier transcript.
 * Long autonomous sessions are AUTO mode's primary use case, so unbounded
 * history will eventually overflow the fast classifier model's context
 * window. After 2 consecutive overflow-induced unavailable verdicts the
 * session falls back to manual approval, defeating the mode's purpose.
 *
 * 40 messages keeps the prompt comfortably within fast-model context budgets
 * while preserving enough of the recent action chain for the classifier to
 * apply its "untrusted tool-output" rule across a multi-step interaction.
 */
/**
 * Maximum number of session messages forwarded to the classifier as
 * context. Exported so the scheduler / ACP session paths can request
 * exactly this slice via `getHistoryTail(MAX_TRANSCRIPT_MESSAGES)`
 * rather than hardcoding `40` — keeping the constant single-sourced
 * means tuning the window doesn't require lockstep edits across
 * three files.
 */
export declare const MAX_TRANSCRIPT_MESSAGES = 40;
/**
 * Build the `contents` array for the classifier sideQuery call.
 *
 * - Keeps user text (user intent is essential context).
 * - Renders each historical model functionCall as a user-role text turn
 *   (projected through `toAutoClassifierInput`).
 * - Strips model text parts (anti-self-injection).
 * - Strips tool result parts (anti-untrusted-content-injection).
 * - Truncates to the most recent {@link MAX_TRANSCRIPT_MESSAGES} messages
 *   so very long sessions don't overflow the classifier context.
 * - Appends `pendingAction` as the final user-role text turn.
 *
 * Result: the classifier request only contains user-role text — no
 * Gemini-native functionCall parts, no assistant tool_calls. Backend-
 * agnostic by construction.
 */
export declare function buildClassifierContents(messages: readonly Content[], toolRegistry: ToolRegistry, pendingAction: PendingAction): Content[];
