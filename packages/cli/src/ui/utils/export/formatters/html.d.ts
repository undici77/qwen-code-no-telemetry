/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExportSessionData } from '../types.js';
/**
 * Loads the HTML template built from assets.
 */
export declare function loadHtmlTemplate(): string;
/**
 * Injects JSON data into the HTML template.
 */
export declare function injectDataIntoHtmlTemplate(template: string, data: {
    sessionId: string;
    startTime: string;
    messages: unknown[];
    metadata?: unknown;
}): string;
/**
 * Converts ExportSessionData to HTML format.
 */
export declare function toHtml(sessionData: ExportSessionData): string;
