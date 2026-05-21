/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SubagentConfig } from '@qwen-code/qwen-code-core';
interface EditOptionsStepProps {
    selectedAgent: SubagentConfig | null;
    onNavigateToStep: (step: string) => void;
}
/**
 * Edit options selection step - choose what to edit about the agent.
 */
export declare function EditOptionsStep({ selectedAgent, onNavigateToStep, }: EditOptionsStepProps): import("react/jsx-runtime").JSX.Element;
export {};
