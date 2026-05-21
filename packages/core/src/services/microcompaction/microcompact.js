/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { sanitizeMimeForPlaceholder } from '../compactionInputSlimming.js';
import { ToolNames } from '../../tools/tool-names.js';
export const MICROCOMPACT_CLEARED_MESSAGE = '[Old tool result content cleared]';
export const MICROCOMPACT_CLEARED_IMAGE_PREFIX = '[Old inline media cleared:';
// IMPORTANT: any new file-touching tool added here MUST also be added
// to FILE_PATH_TOOLS below, or microcompaction will blank its output
// without reporting the eviction — silently reintroducing issue #4239.
const COMPACTABLE_TOOLS = new Set([
    ToolNames.READ_FILE,
    ToolNames.SHELL,
    ToolNames.GREP,
    ToolNames.GLOB,
    ToolNames.WEB_FETCH,
    ToolNames.EDIT,
    ToolNames.WRITE_FILE,
]);
/**
 * Tools whose blanked output drops a file's bytes from history. We
 * report their path so the caller can disarm just that file's
 * fast-path (issue #4239) instead of wiping the whole cache. All three
 * take the target as a `file_path` arg.
 */
const FILE_PATH_TOOLS = new Set([
    ToolNames.READ_FILE,
    ToolNames.EDIT,
    ToolNames.WRITE_FILE,
]);
/**
 * Build a `callId → file_path[]` map for every file-tool call. The path
 * lives on the request-side `functionCall.args`, not on the
 * `functionResponse` microcompaction blanks, so this is the only way
 * to recover which file a cleared result referred to. Calls missing an
 * id or file_path are absent (the caller treats that as unresolvable).
 *
 * Paths accumulate per id rather than overwrite: if a (malformed or
 * resumed) history reuses a `functionCall.id` across different files,
 * disarming *all* candidate paths is the safe choice — over-disarming
 * costs at most a redundant re-read, whereas keeping the wrong file
 * armed would resurrect the dangling-placeholder hazard (issue #4239).
 */
function buildCallIdToFilePath(history) {
    const map = new Map();
    for (const content of history) {
        // functionCall parts are always model-role; skip user/system turns
        // (mirrors collectCompactablePartRefs' role short-circuit).
        if (content.role !== 'model' || !content.parts)
            continue;
        for (const part of content.parts) {
            const call = part.functionCall;
            if (!call?.id || !call.name || !FILE_PATH_TOOLS.has(call.name)) {
                continue;
            }
            const filePath = call.args
                ?.file_path;
            if (typeof filePath === 'string' && filePath.length > 0) {
                const existing = map.get(call.id);
                if (existing)
                    existing.push(filePath);
                else
                    map.set(call.id, [filePath]);
            }
        }
    }
    return map;
}
// --- Trigger evaluation ---
/**
 * Check whether the time-based trigger should fire.
 *
 * A toolResultsThresholdMinutes of -1 means disabled (never clear).
 */
export function evaluateTimeBasedTrigger(lastApiCompletionTimestamp, settings) {
    const thresholdMin = settings.toolResultsThresholdMinutes ?? 60;
    // -1 means disabled
    if (thresholdMin < 0) {
        return null;
    }
    if (lastApiCompletionTimestamp === null) {
        return null;
    }
    const thresholdMs = thresholdMin * 60_000;
    const gapMs = Date.now() - lastApiCompletionTimestamp;
    if (!Number.isFinite(gapMs) || gapMs < thresholdMs) {
        return null;
    }
    return { gapMs };
}
function hasNestedMedia(part) {
    const nested = part.functionResponse
        ?.parts;
    if (!Array.isArray(nested))
        return false;
    return nested.some((p) => !!(p.inlineData || p.fileData));
}
/**
 * Collect references to individual compactable parts across the
 * history, in encounter order, grouped by kind:
 *
 * - `tool`: functionResponse parts produced by compactable tools — the
 *   whole result (including any nested media) is cleared as a unit.
 * - `media`: top-level `inlineData` / `fileData` parts under user-role
 *   messages (e.g. attachments pasted via @reference).
 * - `nested-media`: `functionResponse` parts from NON-compactable tools
 *   that carry images / documents on `functionResponse.parts`. Only the
 *   nested media is dropped; the tool's text output is preserved.
 *
 * Per-part counting means keepRecent applies to individual results even
 * when multiple are batched into one Content message. Each kind has
 * its own `keepRecent` budget so configuring
 * `toolResultsNumToKeep: 1` keeps 1 tool result AND 1 media item, not
 * 1 entry total across the combined list.
 */
function collectCompactablePartRefs(history) {
    const tool = [];
    const media = [];
    const nestedMedia = [];
    for (let ci = 0; ci < history.length; ci++) {
        const content = history[ci];
        if (content.role !== 'user' || !content.parts)
            continue;
        for (let pi = 0; pi < content.parts.length; pi++) {
            const part = content.parts[pi];
            const fnName = part.functionResponse?.name;
            if (fnName && COMPACTABLE_TOOLS.has(fnName)) {
                tool.push({ contentIndex: ci, partIndex: pi, kind: 'tool' });
            }
            else if (part.functionResponse && hasNestedMedia(part)) {
                // Non-compactable tool result with media attached — clear only
                // the nested media so the tool's text output survives.
                nestedMedia.push({
                    contentIndex: ci,
                    partIndex: pi,
                    kind: 'nested-media',
                });
            }
            else if (part.inlineData || part.fileData) {
                media.push({ contentIndex: ci, partIndex: pi, kind: 'media' });
            }
        }
    }
    return { tool, media, nestedMedia };
}
// --- Helpers ---
/** True when the functionResponse carries an error (not a success output). */
function isErrorResponse(part) {
    return part.functionResponse?.response?.['error'] !== undefined;
}
/**
 * Approximate "tokens saved" per cleared part. Used only for metadata
 * reporting (`MicrocompactMeta.tokensSaved`) and the
 * `if (tokensSaved === 0) return { history }` short-circuit, so the
 * value just needs to be roughly proportional to the part's real cost
 * — exactness is not required.
 *
 * Image/document parts use a fixed budget rather than base64 length
 * divided by 4: a 1 MB inline PNG occupies ~1,280 visual tokens on
 * Qwen-VL, not ~350K. Using base64 length would inflate `tokensSaved`
 * by orders of magnitude and is inconsistent with how the slimming
 * module's `estimatePartChars` treats the same content.
 */
const MEDIA_PART_TOKEN_ESTIMATE = 1600;
function estimatePartTokens(part) {
    if (part.functionResponse?.response) {
        let total = 0;
        const output = part.functionResponse.response['output'];
        if (typeof output === 'string') {
            total += Math.ceil(output.length / 4);
        }
        // Tool results may carry nested media on `functionResponse.parts`
        // (see `coreToolScheduler.createFunctionResponsePart`).
        const nested = part.functionResponse.parts;
        if (Array.isArray(nested)) {
            for (const inner of nested) {
                if (inner.inlineData || inner.fileData) {
                    total += MEDIA_PART_TOKEN_ESTIMATE;
                }
            }
        }
        return total;
    }
    if (part.inlineData || part.fileData) {
        return MEDIA_PART_TOKEN_ESTIMATE;
    }
    return 0;
}
/** Defensive guard against re-clearing if a future change reshapes a cleared part into a collectable form. */
function isAlreadyCleared(part) {
    return (part.functionResponse?.response?.['output'] === MICROCOMPACT_CLEARED_MESSAGE);
}
function stripNestedMedia(fnResp) {
    // `parts` isn't declared on the standard FunctionResponse type but is
    // a qwen-code extension — see `coreToolScheduler.createFunctionResponsePart`.
    const { parts: _droppedNested, ...rest } = fnResp;
    return rest;
}
/**
 * Microcompact history: clear old compactable tool results when the
 * time-based trigger fires.
 *
 * Returns the (potentially modified) history and optional metadata
 * about what was cleared (for logging by the caller).
 */
export function microcompactHistory(history, lastApiCompletionTimestamp, settings) {
    const trigger = evaluateTimeBasedTrigger(lastApiCompletionTimestamp, settings);
    if (!trigger) {
        return { history };
    }
    const { gapMs } = trigger;
    const envKeep = process.env['QWEN_MC_KEEP_RECENT'];
    const rawKeepRecent = envKeep !== undefined && Number.isFinite(Number(envKeep))
        ? Number(envKeep)
        : (settings.toolResultsNumToKeep ?? 5);
    const keepRecent = Number.isFinite(rawKeepRecent)
        ? Math.max(1, rawKeepRecent)
        : 5;
    const { tool, media, nestedMedia } = collectCompactablePartRefs(history);
    // Each kind gets its own keepRecent budget: setting
    // `toolResultsNumToKeep: 1` keeps 1 of each, not 1 total. This
    // matches what users typically expect when they configure the
    // threshold for "tool results".
    const refKey = (r) => `${r.contentIndex}:${r.partIndex}`;
    const keepRefs = new Set([
        ...tool.slice(-keepRecent).map(refKey),
        ...media.slice(-keepRecent).map(refKey),
        ...nestedMedia.slice(-keepRecent).map(refKey),
    ]);
    const allRefs = [...tool, ...media, ...nestedMedia];
    const clearRefs = allRefs.filter((r) => !keepRefs.has(refKey(r)));
    if (clearRefs.length === 0) {
        return { history };
    }
    // Build a lookup: contentIndex → Map of partIndex → kind
    const clearMap = new Map();
    for (const ref of clearRefs) {
        let parts = clearMap.get(ref.contentIndex);
        if (!parts) {
            parts = new Map();
            clearMap.set(ref.contentIndex, parts);
        }
        parts.set(ref.partIndex, ref.kind);
    }
    const callIdToFilePath = buildCallIdToFilePath(history);
    const evictedReadPaths = new Set();
    let unresolvedEvictedReads = 0;
    let tokensSaved = 0;
    let toolsCleared = 0;
    let mediaCleared = 0;
    const result = history.map((content, ci) => {
        const partsToClean = clearMap.get(ci);
        if (!partsToClean || !content.parts)
            return content;
        let touched = false;
        const newParts = content.parts.map((part, pi) => {
            const kind = partsToClean.get(pi);
            if (kind === undefined)
                return part;
            if (isAlreadyCleared(part))
                return part;
            if (kind === 'tool' &&
                part.functionResponse?.name &&
                COMPACTABLE_TOOLS.has(part.functionResponse.name) &&
                !isErrorResponse(part)) {
                tokensSaved += estimatePartTokens(part);
                toolsCleared++;
                touched = true;
                // Record the blanked file's path so the caller disarms its
                // fast-path; if unrecoverable, count it so the caller falls
                // back to the blanket wipe (issue #4239).
                if (FILE_PATH_TOOLS.has(part.functionResponse.name)) {
                    const filePaths = part.functionResponse.id
                        ? callIdToFilePath.get(part.functionResponse.id)
                        : undefined;
                    if (filePaths && filePaths.length > 0) {
                        for (const p of filePaths)
                            evictedReadPaths.add(p);
                    }
                    else {
                        unresolvedEvictedReads++;
                    }
                }
                return {
                    functionResponse: {
                        ...stripNestedMedia(part.functionResponse),
                        response: { output: MICROCOMPACT_CLEARED_MESSAGE },
                    },
                };
            }
            if (kind === 'nested-media' &&
                part.functionResponse &&
                !isErrorResponse(part)) {
                // Non-compactable tool result: keep response.output, drop only
                // the nested media on functionResponse.parts.
                tokensSaved += estimatePartTokens(part);
                mediaCleared++;
                touched = true;
                return {
                    functionResponse: stripNestedMedia(part.functionResponse),
                };
            }
            if (kind === 'media' && (part.inlineData || part.fileData)) {
                const mime = part.inlineData?.mimeType ??
                    part.fileData?.mimeType ??
                    'application/octet-stream';
                tokensSaved += estimatePartTokens(part);
                mediaCleared++;
                touched = true;
                return {
                    text: `${MICROCOMPACT_CLEARED_IMAGE_PREFIX} ${sanitizeMimeForPlaceholder(mime)}]`,
                };
            }
            return part;
        });
        if (!touched)
            return content;
        return { ...content, parts: newParts };
    });
    if (tokensSaved === 0) {
        return { history };
    }
    const thresholdMinutes = settings.toolResultsThresholdMinutes ?? 60;
    const toolsKept = tool.length - toolsCleared;
    const mediaKept = media.length + nestedMedia.length - mediaCleared;
    return {
        history: result,
        meta: {
            gapMinutes: Math.round(gapMs / 60_000),
            thresholdMinutes,
            toolsCleared,
            mediaCleared,
            toolsKept,
            mediaKept,
            keepRecent,
            tokensSaved,
            evictedReadPaths: [...evictedReadPaths],
            unresolvedEvictedReads,
        },
    };
}
//# sourceMappingURL=microcompact.js.map