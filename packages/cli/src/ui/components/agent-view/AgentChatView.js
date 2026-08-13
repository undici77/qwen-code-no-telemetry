import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Arena wrapper around AgentChatContent. Resolves the selected agent
 * from AgentViewContext; the content component owns live-state reads
 * and the Ctrl+F embedded-shell toggle.
 */
import { useAgentViewState } from '../../contexts/AgentViewContext.js';
import { AgentChatContent, AgentChatMissing } from './AgentChatContent.js';
export const AgentChatView = ({ agentId }) => {
    const { agents } = useAgentViewState();
    const agent = agents.get(agentId);
    const interactiveAgent = agent?.interactiveAgent;
    const core = interactiveAgent?.getCore();
    if (!agent || !interactiveAgent || !core) {
        return _jsx(AgentChatMissing, { label: `Agent "${agentId}" not found.` });
    }
    return (_jsx(AgentChatContent, { core: core, interactiveAgent: interactiveAgent, instanceKey: agentId, modelName: agent.modelName }));
};
//# sourceMappingURL=AgentChatView.js.map