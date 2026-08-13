/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { prepareTranscriptRecords, TranscriptRecordPreparationError, } from '@qwen-code/qwen-code-core/transcriptRecords';
import { createTranscriptReplayMachine } from '@qwen-code/acp-bridge/transcriptReplay';
import { normalizeDaemonEvent } from './normalizer.js';
import { createDaemonTranscriptState, finalizeOfflineDaemonTranscriptState, reduceDaemonTranscriptEvents, } from './transcript.js';
export class TranscriptProjectionInputError extends TypeError {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'TranscriptProjectionInputError';
    }
}
export function projectChatRecordsToDaemonTranscript(records, options = {}) {
    if (!Array.isArray(records)) {
        throw new TranscriptProjectionInputError('invalid_records', 'Transcript records must be an array.');
    }
    if (options.maxBlocks !== undefined &&
        (!Number.isSafeInteger(options.maxBlocks) || options.maxBlocks <= 0)) {
        throw new TranscriptProjectionInputError('invalid_max_blocks', 'maxBlocks must be a positive safe integer.');
    }
    let prepared;
    try {
        prepared = prepareTranscriptRecords(records, {
            ...(options.leafUuid !== undefined ? { leafUuid: options.leafUuid } : {}),
        });
    }
    catch (error) {
        if (error instanceof TranscriptRecordPreparationError) {
            throw new TranscriptProjectionInputError(error.code, error.message);
        }
        throw error;
    }
    const diagnostics = [
        ...prepared.diagnostics,
    ];
    const diagnosticKeys = new Set(diagnostics.map((item) => diagnosticKey(item)));
    const addDiagnostic = (diagnostic) => {
        const key = diagnosticKey(diagnostic);
        if (diagnosticKeys.has(key))
            return;
        diagnosticKeys.add(key);
        diagnostics.push(diagnostic);
    };
    const maxBlocks = options.maxBlocks ?? Number.MAX_SAFE_INTEGER;
    let truncated = false;
    let state = createDaemonTranscriptState({
        maxBlocks,
        now: 0,
        onTruncation: (detail) => {
            truncated = true;
            addDiagnostic({
                code: detail.kind === 'blocks'
                    ? 'transcript_blocks_truncated'
                    : 'transcript_text_truncated',
                severity: 'warning',
                message: detail.kind === 'blocks'
                    ? 'Older transcript blocks were removed by maxBlocks.'
                    : 'A transcript text block exceeded the safe character limit.',
                affectsCompleteness: true,
                ...(detail.sourceRecordIds?.[0]
                    ? { recordId: detail.sourceRecordIds[0] }
                    : {}),
                ...(detail.blockId ? { path: `blocks.${detail.blockId}` } : {}),
            });
        },
    });
    const machine = createTranscriptReplayMachine({
        gaps: prepared.gaps,
        onDiagnostic: addDiagnostic,
    });
    const consume = (emissions) => {
        for (const emission of emissions) {
            const event = {
                v: 1,
                type: 'session_update',
                data: { update: emission.update },
            };
            const uiEvents = normalizeDaemonEvent(event);
            state = reduceDaemonTranscriptEvents(state, uiEvents, {
                maxBlocks,
                now: 0,
            });
        }
    };
    for (const record of prepared.records)
        consume(machine.project(record));
    consume(machine.finalize());
    state = finalizeOfflineDaemonTranscriptState(state);
    const complete = !truncated &&
        !diagnostics.some((diagnostic) => diagnostic.affectsCompleteness);
    return {
        blocks: state.blocks,
        diagnostics,
        complete,
        truncated,
    };
}
function diagnosticKey(diagnostic) {
    return JSON.stringify([
        diagnostic.code,
        diagnostic.recordIndex,
        diagnostic.recordId,
        diagnostic.path,
    ]);
}
//# sourceMappingURL=chat-record-transcript.js.map