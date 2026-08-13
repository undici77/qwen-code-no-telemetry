/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Response } from 'express';
export declare const GENERATION_HEARTBEAT_MS = 15000;
export declare function formatGenerationSse(event: string, data: Record<string, unknown>): string;
export declare function writeGenerationSseChunk(res: Response, chunk: string): Promise<void>;
