/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
interface AgentCreationWizardProps {
    onClose: () => void;
    config: Config | null;
}
/**
 * Main orchestrator component for the subagent creation wizard.
 */
export declare function AgentCreationWizard({ onClose, config, }: AgentCreationWizardProps): import("react/jsx-runtime").JSX.Element;
export {};
