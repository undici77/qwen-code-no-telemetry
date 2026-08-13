/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export type SedScriptSafety = 'read-only' | 'write' | 'unknown';
export type AwkScriptSafety = SedScriptSafety;
export declare function classifySedScriptSafety(script: string): SedScriptSafety;
export declare function classifySedCommandSafety(args: string[]): SedScriptSafety;
export declare function classifyAwkScriptSafety(script: string): AwkScriptSafety;
export declare function classifyAwkCommandSafety(args: string[]): AwkScriptSafety;
export declare function hasShellBraceExpansion(text: string): boolean;
export declare function hasShellPatternExpansion(text: string): boolean;
