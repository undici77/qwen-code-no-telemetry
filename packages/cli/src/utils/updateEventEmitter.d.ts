/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
/**
 * A shared event emitter for application-wide communication
 * between decoupled parts of the CLI.
 */
export declare const updateEventEmitter: EventEmitter<[never]>;
