/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
type QwenTextRecord = {
    type?: unknown;
    message?: unknown;
    systemPayload?: unknown;
};
export declare function qwenContentToText(message: unknown): string;
export declare function qwenRecordToText(record: QwenTextRecord): string;
export {};
