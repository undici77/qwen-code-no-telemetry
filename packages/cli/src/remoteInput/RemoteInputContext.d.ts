/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { RemoteInputWatcher } from './RemoteInputWatcher.js';
export declare const RemoteInputContext: import("react").Context<RemoteInputWatcher | null>;
export declare const useRemoteInput: () => RemoteInputWatcher | null;
