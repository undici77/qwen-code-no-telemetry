/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface WorkerDiagnosticRedactionOptions {
    daemonToken?: string;
    workerEnv: Readonly<NodeJS.ProcessEnv>;
}
export declare function normalizeWorkerDiagnostic(value: string): string;
export declare function createWorkerDiagnosticRedactor(opts: WorkerDiagnosticRedactionOptions): (value: string) => string;
export declare function sanitizeWorkerDiagnostic(value: string, maxLength: number, opts: WorkerDiagnosticRedactionOptions): string;
