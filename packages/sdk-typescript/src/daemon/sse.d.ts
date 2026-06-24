/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonEvent } from './types.js';
/**
 * Bd10T: typed error raised by `parseSseStream` on framing-level
 * violations (today: buffer-overflow from a non-SSE upstream that
 * never emits the `\n\n` separator). Lets SDK consumers distinguish
 * "the upstream isn't an SSE stream" from generic network failures
 * via `err instanceof SseFramingError` instead of fragile string
 * matching on `err.message`.
 */
export declare class SseFramingError extends Error {
    constructor(message: string);
}
export declare function parseSseStream(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<DaemonEvent>;
