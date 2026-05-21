/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface SemanticColors {
    text: {
        primary: string;
        secondary: string;
        link: string;
        accent: string;
        code: string;
    };
    background: {
        primary: string;
        diff: {
            added: string;
            removed: string;
        };
    };
    border: {
        default: string;
        focused: string;
    };
    ui: {
        comment: string;
        symbol: string;
        gradient: string[] | undefined;
    };
    status: {
        error: string;
        success: string;
        warning: string;
        errorDim: string;
        warningDim: string;
    };
}
export declare const lightSemanticColors: SemanticColors;
export declare const darkSemanticColors: SemanticColors;
export declare const ansiSemanticColors: SemanticColors;
