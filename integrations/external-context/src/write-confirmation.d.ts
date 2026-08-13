/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface HookDecisionOutput {
    hookSpecificOutput: {
        hookEventName: 'PreToolUse';
        permissionDecision: 'ask' | 'deny';
        permissionDecisionReason: string;
    };
}
type HookOutput = HookDecisionOutput | Record<string, never>;
type HookInputStream = AsyncIterable<string | Uint8Array> & {
    destroy?(): void;
};
interface HookOutputStream {
    write(value: string): unknown;
}
export declare function runWriteConfirmation(value: unknown): HookOutput;
export declare function runWriteConfirmationCli(inputStream?: HookInputStream, outputStream?: HookOutputStream): Promise<void>;
export {};
