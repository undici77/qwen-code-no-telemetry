/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
type TerminalEnvironment = Record<string, string | undefined>;
export declare function isCiEnvKey(key: string): boolean;
export declare function isInteractiveTerminal(stdoutIsTTY?: boolean | undefined, env?: TerminalEnvironment): boolean;
export declare function shouldUseVirtualViewport(useTerminalBuffer: boolean | undefined, screenReader: boolean, terminalInteractive: boolean): boolean;
export {};
