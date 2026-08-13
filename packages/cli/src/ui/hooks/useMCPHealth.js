/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * useMCPHealth — subscribes to MCP server status changes from
 * `mcp-client`'s module-level listener API and re-renders consumers
 * with up-to-date counts. The Footer MCP health pill is the primary
 * consumer; the hook intentionally exposes raw counts (not just a
 * formatted label) so future surfaces (boot screen, tooltips) can
 * derive their own presentation.
 */
import { useEffect, useState } from 'react';
import { MCPServerStatus, addMCPStatusChangeListener, removeMCPStatusChangeListener, getAllMCPServerStatuses, } from '@qwen-code/qwen-code-core';
export function useMCPHealth() {
    const [servers, setServers] = useState(() => new Map(getAllMCPServerStatuses()));
    useEffect(() => {
        const listener = (name, status) => {
            setServers((prev) => {
                const next = new Map(prev);
                if (status === undefined) {
                    // Server was removed from the registry (e.g. disabled via /mcp).
                    next.delete(name);
                }
                else {
                    next.set(name, status);
                }
                return next;
            });
        };
        addMCPStatusChangeListener(listener);
        // Resync once on mount in case the registry transitioned between
        // the initial snapshot capture and listener attachment.
        setServers(new Map(getAllMCPServerStatuses()));
        return () => removeMCPStatusChangeListener(listener);
    }, []);
    let disconnectedCount = 0;
    let connectingCount = 0;
    let connectedCount = 0;
    for (const status of servers.values()) {
        if (status === MCPServerStatus.DISCONNECTED)
            disconnectedCount++;
        else if (status === MCPServerStatus.CONNECTING)
            connectingCount++;
        else if (status === MCPServerStatus.CONNECTED)
            connectedCount++;
    }
    return {
        totalCount: servers.size,
        disconnectedCount,
        connectingCount,
        connectedCount,
    };
}
//# sourceMappingURL=useMCPHealth.js.map