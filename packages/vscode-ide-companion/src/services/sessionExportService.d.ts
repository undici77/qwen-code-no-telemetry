/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import { EXPORT_SESSION_FORMATS, type SessionExportFormat } from '../utils/exportSlashCommand.js';
export { EXPORT_SESSION_FORMATS as SESSION_EXPORT_FORMATS };
export type { SessionExportFormat } from '../utils/exportSlashCommand.js';
export interface SessionExportResult {
    filename: string;
    uri: vscode.Uri;
}
export declare function parseExportSlashCommand(text: string): SessionExportFormat | null;
/**
 * Export session to file via a native Save dialog.
 * Returns null if the user cancels the dialog.
 *
 * @param options.sessionId - The session to export
 * @param options.cwd - Working directory used as default save location
 * @param options.format - Target format (html, md, json, jsonl)
 * @returns Export result with filename and URI, or null if cancelled
 */
export declare function exportSessionToFile(options: {
    sessionId: string;
    cwd: string;
    format: SessionExportFormat;
}): Promise<SessionExportResult | null>;
