/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// ---------------------------------------------------------------------------
// Transport errors
// ---------------------------------------------------------------------------
/**
 * Thrown when an operation is attempted on a transport whose
 * connection has been closed (disposed, WS close, etc.).
 */
export class DaemonTransportClosedError extends Error {
    constructor(message) {
        super(message ?? 'Transport connection closed');
        this.name = 'DaemonTransportClosedError';
    }
}
//# sourceMappingURL=DaemonTransport.js.map