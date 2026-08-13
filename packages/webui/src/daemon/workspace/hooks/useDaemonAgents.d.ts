/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonResourceOptions } from '../types.js';
export declare function useDaemonAgents(options?: DaemonResourceOptions): {
    status: import("@qwen-code/sdk/daemon").DaemonWorkspaceAgentsStatus | undefined;
    agents: import("@qwen-code/sdk/daemon").DaemonWorkspaceAgentSummary[];
    getAgent: (agentType: string, scope?: "workspace" | "global") => Promise<import("@qwen-code/sdk/daemon").DaemonWorkspaceAgentDetail>;
    createAgent: (req: import("@qwen-code/sdk/daemon").DaemonCreateAgentRequest) => Promise<import("@qwen-code/sdk/daemon").DaemonAgentMutationResult>;
    generateAgent: (description: string) => Promise<import("@qwen-code/sdk/daemon").DaemonGeneratedAgentContent>;
    generateContent: (prompt: string, opts?: {
        signal?: AbortSignal;
    }) => AsyncGenerator<import("@qwen-code/sdk/daemon").DaemonWorkspaceGenerationEvent>;
    deleteAgent: (agentType: string, scope?: "workspace" | "global") => Promise<void>;
    updateAgent: (agentType: string, req: import("@qwen-code/sdk/daemon").DaemonUpdateAgentRequest, scope?: "workspace" | "global") => Promise<import("@qwen-code/sdk/daemon").DaemonAgentMutationResult>;
    reload: () => Promise<import("@qwen-code/sdk/daemon").DaemonWorkspaceAgentsStatus | undefined>;
    data: import("@qwen-code/sdk/daemon").DaemonWorkspaceAgentsStatus | undefined;
    loading: boolean;
    error: Error | undefined;
};
