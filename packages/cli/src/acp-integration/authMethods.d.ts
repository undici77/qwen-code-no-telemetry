/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AuthMethod } from '@agentclientprotocol/sdk';
export declare function buildAuthMethods(): AuthMethod[];
export declare function filterAuthMethodsById(authMethods: AuthMethod[], authMethodId: string): AuthMethod[];
export declare function pickAuthMethodsForDetails(details?: string): AuthMethod[];
