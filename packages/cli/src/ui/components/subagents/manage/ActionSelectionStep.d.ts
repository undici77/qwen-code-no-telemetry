/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SubagentConfig } from '@qwen-code/qwen-code-core';
interface ActionSelectionStepProps {
    selectedAgent: SubagentConfig | null;
    onNavigateToStep: (step: string) => void;
    onNavigateBack: () => void;
}
export declare const ActionSelectionStep: ({ selectedAgent, onNavigateToStep, onNavigateBack, }: ActionSelectionStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
