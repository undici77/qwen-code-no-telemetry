/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function relaunchOnExitCode(runner: () => Promise<number>): Promise<void>;
export declare function relaunchAppInChildProcess(additionalNodeArgs: string[], additionalScriptArgs: string[]): Promise<void>;
