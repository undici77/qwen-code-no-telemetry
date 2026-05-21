/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Extension } from '@qwen-code/qwen-code-core';
import { type ExtensionAction } from '../types.js';
interface ActionSelectionStepProps {
    selectedExtension: Extension | null;
    hasUpdateAvailable: boolean;
    onNavigateToStep: (step: string) => void;
    onActionSelect: (action: ExtensionAction) => void;
}
export declare const ActionSelectionStep: ({ selectedExtension, hasUpdateAvailable, onActionSelect, }: ActionSelectionStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
