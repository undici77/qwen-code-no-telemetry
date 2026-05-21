/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSpanExporter } from './file-exporters.js';
describe('FileExporter.serialize', () => {
    let tmpDir;
    let exporter;
    let serialize;
    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-exporters-test-'));
        exporter = new FileSpanExporter(path.join(tmpDir, 'out.jsonl'));
        serialize = exporter.serialize.bind(exporter);
    });
    afterEach(async () => {
        await exporter.shutdown();
        // Windows occasionally returns ENOTEMPTY when the underlying file
        // handle isn't fully released yet; retry a few times before failing.
        fs.rmSync(tmpDir, {
            recursive: true,
            force: true,
            maxRetries: 5,
            retryDelay: 50,
        });
    });
    // Regression for upstream PR #4689: a raw JSON.stringify on a ReadableSpan
    // crashed because BatchSpanProcessor._shutdownOnce -> BindOnceFuture._that
    // forms a cycle. The exporter must delegate to safeJsonStringify so cycles
    // become "[Circular]" instead of throwing.
    it('does not throw on BatchSpanProcessor-shaped cycle', () => {
        const proc = { kind: 'BatchSpanProcessor' };
        const future = { kind: 'BindOnceFuture' };
        proc['_shutdownOnce'] = future;
        future['_that'] = proc;
        const span = { name: 'span-1', _spanProcessor: proc };
        expect(() => serialize(span)).not.toThrow();
        const out = serialize(span);
        expect(out).toContain('"name": "span-1"');
        expect(out).toContain('"[Circular]"');
        expect(out.endsWith('\n')).toBe(true);
    });
});
//# sourceMappingURL=file-exporters.test.js.map