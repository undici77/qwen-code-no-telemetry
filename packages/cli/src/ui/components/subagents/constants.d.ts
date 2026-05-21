/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Constants for the subagent creation wizard.
 */
export declare const WIZARD_STEPS: {
    readonly LOCATION_SELECTION: 1;
    readonly GENERATION_METHOD: 2;
    readonly DESCRIPTION_INPUT: 3;
    readonly TOOL_SELECTION: 4;
    readonly COLOR_SELECTION: 5;
    readonly FINAL_CONFIRMATION: 6;
};
export declare const TOTAL_WIZARD_STEPS = 6;
export declare const STEP_NAMES: Record<number, string>;
export declare const COLOR_OPTIONS: {
    id: string;
    name: string;
    value: string;
}[];
