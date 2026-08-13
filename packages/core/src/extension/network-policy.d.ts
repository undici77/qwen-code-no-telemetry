/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type LookupFunction } from 'node:net';
import type { ExtensionNetworkPolicy } from '../config/config.js';
export interface ResolvedNetworkTarget {
    url: URL;
    lookup?: LookupFunction;
    curlResolve?: string;
}
export declare function resolveNetworkTarget(value: string | URL, policy?: ExtensionNetworkPolicy, signal?: AbortSignal): Promise<ResolvedNetworkTarget>;
