/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface MCPHealthSnapshot {
    /** Total servers tracked by the registry (configured + discovered). */
    totalCount: number;
    /** Servers currently in `DISCONNECTED` — usually means failed connect / lost link. */
    disconnectedCount: number;
    /** Servers in mid-handshake. Often transient during boot or reconnect. */
    connectingCount: number;
    /** Servers currently `CONNECTED`. */
    connectedCount: number;
}
export declare function useMCPHealth(): MCPHealthSnapshot;
