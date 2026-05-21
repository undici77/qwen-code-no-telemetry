/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as pty from '@lydell/node-pty';
export declare function createToolCallErrorMessage(expectedTools: string | string[], foundTools: string[], result: string): string;
export declare function printDebugInfo(rig: TestRig, result: string, context?: Record<string, unknown>): {
    toolRequest: {
        name: string;
        args: string;
        success: boolean;
        duration_ms: number;
    };
}[];
export declare function validateModelOutput(result: string, expectedContent?: string | (string | RegExp)[] | null, testName?: string): boolean;
export declare function type(ptyProcess: pty.IPty, text: string): Promise<void>;
export declare class TestRig {
    bundlePath: string;
    testDir: string | null;
    testName?: string;
    _lastRunStdout?: string;
    _interactiveOutput: string;
    constructor();
    getDefaultTimeout(): 60000 | 30000 | 15000;
    setup(testName: string, options?: {
        settings?: Record<string, unknown>;
    }): void;
    createFile(fileName: string, content: string): string;
    mkdir(dir: string): void;
    sync(): void;
    /**
     * The command and args to use to invoke Qwen Code CLI. Allows us to switch
     * between using the bundled gemini.js (the default) and using the installed
     * 'qwen' (used to verify npm bundles).
     */
    private _getCommandAndArgs;
    run(promptOrOptions: string | {
        prompt?: string;
        stdin?: string;
        stdinDoesNotEnd?: boolean;
    }, ...args: string[]): Promise<string>;
    runCommand(args: string[], options?: {
        stdin?: string;
    }): Promise<string>;
    readFile(fileName: string): string;
    cleanup(): Promise<void>;
    waitForTelemetryReady(): Promise<void>;
    waitForTelemetryEvent(eventName: string, timeout?: number): Promise<boolean>;
    waitForToolCall(toolName: string, timeout?: number): Promise<boolean>;
    waitForAnyToolCall(toolNames: string[], timeout?: number): Promise<boolean>;
    poll(predicate: () => boolean, timeout: number, interval: number): Promise<boolean>;
    _parseToolLogsFromStdout(stdout: string): {
        timestamp: number;
        toolRequest: {
            name: string;
            args: string;
            success: boolean;
            duration_ms: number;
        };
    }[];
    private _readAndParseTelemetryLog;
    readToolLogs(): {
        toolRequest: {
            name: string;
            args: string;
            success: boolean;
            duration_ms: number;
        };
    }[];
    readLastApiRequest(): Record<string, unknown> | null;
    readMetric(metricName: string): Record<string, unknown> | null;
    waitForText(text: string, timeout?: number): Promise<boolean>;
    runInteractive(...args: string[]): {
        ptyProcess: pty.IPty;
        promise: Promise<{
            exitCode: number;
            signal?: number;
            output: string;
        }>;
    };
}
