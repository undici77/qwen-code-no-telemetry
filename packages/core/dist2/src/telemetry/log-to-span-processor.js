/*
 * Copyright (c) Alibaba Group Holding Ltd.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
// No-op implementation for no-telemetry policy
export class LogToSpanProcessor {
    constructor() { }
    onEmit() { }
    shutdown() {
        return Promise.resolve();
    }
    forceFlush() {
        return Promise.resolve();
    }
}
export function resourceFromAttributes() {
    return {};
}
//# sourceMappingURL=log-to-span-processor.js.map