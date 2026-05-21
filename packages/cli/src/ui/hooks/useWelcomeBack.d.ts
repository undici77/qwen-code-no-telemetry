/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ProjectSummaryInfo, type Config } from '@qwen-code/qwen-code-core';
import { type Settings } from '../../config/settingsSchema.js';
export interface WelcomeBackState {
    welcomeBackInfo: ProjectSummaryInfo | null;
    showWelcomeBackDialog: boolean;
    welcomeBackChoice: 'restart' | 'continue' | null;
    shouldFillInput: boolean;
    inputFillText: string | null;
}
export interface WelcomeBackActions {
    handleWelcomeBackSelection: (choice: 'restart' | 'continue') => void;
    handleWelcomeBackClose: () => void;
    checkWelcomeBack: () => Promise<void>;
    clearInputFill: () => void;
}
export declare function useWelcomeBack(config: Config, submitQuery: (query: string) => void, buffer: {
    setText: (text: string) => void;
}, settings: Settings): WelcomeBackState & WelcomeBackActions;
