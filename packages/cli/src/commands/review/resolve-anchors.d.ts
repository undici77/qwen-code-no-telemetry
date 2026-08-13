/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type AnchorRequest } from './lib/anchors.js';
/** Every request carries an id, a path and a snippet; the rest is optional. */
export declare function validateRequests(raw: unknown): AnchorRequest[];
export declare const resolveAnchorsCommand: CommandModule;
