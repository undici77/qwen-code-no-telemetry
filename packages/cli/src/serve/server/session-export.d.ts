/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SessionArchiveState } from '@qwen-code/qwen-code-core';
import { type ExportConfig } from '../../ui/utils/export/index.js';
declare const SESSION_EXPORT_FORMATS: readonly ["html", "md", "json", "jsonl"];
export type SessionExportFormat = (typeof SESSION_EXPORT_FORMATS)[number];
export interface SessionExportResult {
    format: SessionExportFormat;
    filename: string;
    mimeType: string;
    content: string;
}
export declare function parseSessionExportFormat(rawFormat: unknown): SessionExportFormat | undefined;
export declare function sessionExportFormatValues(): SessionExportFormat[];
export declare function exportSessionTranscript(params: {
    workspaceCwd: string;
    sessionId: string;
    format: SessionExportFormat;
    archiveState?: SessionArchiveState;
    config?: ExportConfig;
}): Promise<SessionExportResult>;
export {};
