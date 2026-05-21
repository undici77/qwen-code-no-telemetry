/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const shouldShowColor: (color?: string) => boolean;
export declare const getColorForDisplay: (colorName?: string) => string | undefined;
/**
 * Sanitizes user input by removing dangerous characters and normalizing whitespace.
 */
export declare function sanitizeInput(input: string): string;
export declare function fmtDuration(ms: number): string;
export type StepKind = 'LOCATION' | 'GEN_METHOD' | 'LLM_DESC' | 'MANUAL_NAME' | 'MANUAL_PROMPT' | 'MANUAL_DESC' | 'TOOLS' | 'COLOR' | 'FINAL';
export declare function getTotalSteps(method: 'qwen' | 'manual'): number;
export declare function getStepKind(method: 'qwen' | 'manual', stepNumber: number): StepKind;
