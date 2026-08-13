/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SESSION_TRANSCRIPT_MAX_INDEX_BYTES, SessionService, } from '@qwen-code/qwen-code-core';
import { SessionNotFoundError } from '../acp-session-bridge.js';
import { collectSessionData, generateExportFilename, normalizeSessionData, toHtml, toJson, toJsonl, toMarkdown, } from '../../ui/utils/export/index.js';
const SESSION_EXPORT_FORMATS = ['html', 'md', 'json', 'jsonl'];
const EXPORT_FORMATS = {
    html: {
        mimeType: 'text/html; charset=utf-8',
        render: toHtml,
    },
    md: {
        mimeType: 'text/markdown; charset=utf-8',
        render: toMarkdown,
    },
    json: {
        mimeType: 'application/json; charset=utf-8',
        render: toJson,
    },
    jsonl: {
        mimeType: 'application/jsonl; charset=utf-8',
        render: toJsonl,
    },
};
export function parseSessionExportFormat(rawFormat) {
    if (rawFormat === undefined)
        return 'html';
    if (typeof rawFormat !== 'string')
        return undefined;
    return SESSION_EXPORT_FORMATS.includes(rawFormat)
        ? rawFormat
        : undefined;
}
export function sessionExportFormatValues() {
    return [...SESSION_EXPORT_FORMATS];
}
export async function exportSessionTranscript(params) {
    const { workspaceCwd, sessionId, format } = params;
    const service = new SessionService(workspaceCwd);
    const sessionData = params.archiveState === 'archived'
        ? await service.loadArchivedSession(sessionId, {
            maxBytes: SESSION_TRANSCRIPT_MAX_INDEX_BYTES,
        })
        : await service.loadSession(sessionId);
    if (!sessionData) {
        throw new SessionNotFoundError(sessionId);
    }
    const exportConfig = params.config ?? {};
    const collected = await collectSessionData(sessionData.conversation, exportConfig);
    const normalized = normalizeSessionData(collected, sessionData.conversation.messages, exportConfig);
    const formatDefinition = EXPORT_FORMATS[format];
    return {
        format,
        filename: generateExportFilename(format),
        mimeType: formatDefinition.mimeType,
        content: formatDefinition.render(normalized),
    };
}
//# sourceMappingURL=session-export.js.map