/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { safeJsonStringify } from '../utils/safeJsonStringify.js';
// No-op implementations for no-telemetry policy
// These classes are stubs to maintain compatibility without opentelemetry dependencies
class FileExporter {
    constructor(_filePath) { }
    serialize(data) {
        return safeJsonStringify(data, 2) + '\n';
    }
    async shutdown() {
        return Promise.resolve();
    }
}
export class FileSpanExporter extends FileExporter {
    export(_spans, resultCallback) {
        resultCallback({ code: 0 }); // SUCCESS
    }
}
export class FileLogExporter extends FileExporter {
    export(_logs, resultCallback) {
        resultCallback({ code: 0 }); // SUCCESS
    }
}
export class FileMetricExporter extends FileExporter {
    export(_metrics, resultCallback) {
        resultCallback({ code: 0 }); // SUCCESS
    }
    getPreferredAggregationTemporality() {
        return 1; // CUMULATIVE
    }
    async forceFlush() {
        return Promise.resolve();
    }
}
//# sourceMappingURL=file-exporters.js.map