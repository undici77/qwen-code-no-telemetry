/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
type HookOutput = Record<string, never> | {
    hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit';
        additionalContext: string;
    };
};
type HookInputStream = AsyncIterable<string | Uint8Array> & {
    destroy?(): void;
};
interface HookOutputStream {
    write(value: string): unknown;
}
export declare function runAutoRecall(value: unknown, env?: NodeJS.ProcessEnv, signal?: AbortSignal): Promise<HookOutput>;
export declare function createAutoRecallQuery(submittedPrompt: string, credential: string): string | undefined;
export declare function runAutoRecallCli(inputStream?: HookInputStream, outputStream?: HookOutputStream, env?: NodeJS.ProcessEnv): Promise<void>;
export {};
