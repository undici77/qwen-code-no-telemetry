/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AcquireSessionWriterLeaseOptions } from './session-writer-lease.js';
export type SessionWriterLeaseTestCommandInput = {
    type: 'acquire';
    options: AcquireSessionWriterLeaseOptions;
} | {
    type: 'append';
    value: unknown;
} | {
    type: 'release';
};
export type SessionWriterLeaseTestCommand = SessionWriterLeaseTestCommandInput & {
    id: number;
};
export interface SessionWriterLeaseTestResponse {
    id: number;
    ok: boolean;
    ownerId?: string;
    errorKind?: string;
    message?: string;
}
