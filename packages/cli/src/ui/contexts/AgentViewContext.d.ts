/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentInteractive, type ApprovalMode, type Config } from '@qwen-code/qwen-code-core';
export interface RegisteredAgent {
    interactiveAgent: AgentInteractive;
    /** Model identifier shown in tabs and paths (e.g. "glm-5"). */
    modelId: string;
    /** Human-friendly model name (e.g. "GLM 5"). */
    modelName?: string;
    color: string;
}
export interface AgentViewState {
    /** 'main' or an agentId */
    activeView: string;
    /** Registered in-process agents keyed by agentId */
    agents: ReadonlyMap<string, RegisteredAgent>;
    /** Whether any agent tab's embedded shell currently has input focus. */
    agentShellFocused: boolean;
    /** Current text in the active agent tab's input buffer (empty when on main). */
    agentInputBufferText: string;
    /** Whether the tab bar has keyboard focus (vs the agent input). */
    agentTabBarFocused: boolean;
    /** Per-agent approval modes (keyed by agentId). */
    agentApprovalModes: ReadonlyMap<string, ApprovalMode>;
}
export interface AgentViewActions {
    switchToMain(): void;
    switchToAgent(agentId: string): void;
    switchToNext(): void;
    switchToPrevious(): void;
    registerAgent(agentId: string, interactiveAgent: AgentInteractive, modelId: string, color: string, modelName?: string): void;
    unregisterAgent(agentId: string): void;
    unregisterAll(): void;
    setAgentShellFocused(focused: boolean): void;
    setAgentInputBufferText(text: string): void;
    setAgentTabBarFocused(focused: boolean): void;
    setAgentApprovalMode(agentId: string, mode: ApprovalMode): void;
}
export declare function useAgentViewState(): AgentViewState;
export declare function useAgentViewActions(): AgentViewActions;
interface AgentViewProviderProps {
    config?: Config;
    children: React.ReactNode;
}
export declare function AgentViewProvider({ config, children, }: AgentViewProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
