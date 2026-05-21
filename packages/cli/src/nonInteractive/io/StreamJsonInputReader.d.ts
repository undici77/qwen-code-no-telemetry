/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Readable } from 'node:stream';
import type { CLIControlRequest, CLIControlResponse, CLIMessage, ControlCancelRequest } from '../types.js';
export type StreamJsonInputMessage = CLIMessage | CLIControlRequest | CLIControlResponse | ControlCancelRequest;
export declare class StreamJsonParseError extends Error {
}
export declare class StreamJsonInputReader {
    private readonly input;
    constructor(input?: Readable);
    read(): AsyncGenerator<StreamJsonInputMessage>;
    private parse;
}
