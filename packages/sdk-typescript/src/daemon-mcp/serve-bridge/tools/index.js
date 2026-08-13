/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { infrastructureTools } from './infrastructure.js';
import { sessionTools } from './session.js';
import { agentTools } from './agent.js';
import { workspaceReadTools } from './workspaceRead.js';
import { workspaceWriteTools } from './workspaceWrite.js';
/**
 * Collect all MCP tool definitions for the serve-bridge.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function allTools(state) {
    return [
        ...infrastructureTools(state),
        ...sessionTools(state),
        ...agentTools(state),
        ...workspaceReadTools(state),
        ...workspaceWriteTools(state),
    ];
}
//# sourceMappingURL=index.js.map