/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { COLOR_OPTIONS, TOTAL_WIZARD_STEPS } from './constants.js';
export const shouldShowColor = (color) => color !== undefined && color !== 'auto';
export const getColorForDisplay = (colorName) => !colorName || colorName === 'auto'
    ? undefined
    : COLOR_OPTIONS.find((color) => color.name === colorName)?.value;
/**
 * Sanitizes user input by removing dangerous characters and normalizing whitespace.
 */
export function sanitizeInput(input) {
    return (input
        .trim()
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
    ); // Limit length
}
export function fmtDuration(ms) {
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${m}m ${s}s`;
    }
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
}
export function getTotalSteps(method) {
    return method === 'manual' ? 8 : TOTAL_WIZARD_STEPS;
}
export function getStepKind(method, stepNumber) {
    if (method === 'manual') {
        switch (stepNumber) {
            case 1:
                return 'LOCATION';
            case 2:
                return 'GEN_METHOD';
            case 3:
                return 'MANUAL_NAME';
            case 4:
                return 'MANUAL_PROMPT';
            case 5:
                return 'MANUAL_DESC';
            case 6:
                return 'TOOLS';
            case 7:
                return 'COLOR';
            case 8:
                return 'FINAL';
            default:
                return 'FINAL';
        }
    }
    switch (stepNumber) {
        case 1:
            return 'LOCATION';
        case 2:
            return 'GEN_METHOD';
        case 3:
            return 'LLM_DESC';
        case 4:
            return 'TOOLS';
        case 5:
            return 'COLOR';
        case 6:
            return 'FINAL';
        default:
            return 'FINAL';
    }
}
//# sourceMappingURL=utils.js.map