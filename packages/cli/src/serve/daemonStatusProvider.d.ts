/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonStatusProvider } from '@qwen-code/acp-bridge';
/**
 * Construct the production `DaemonStatusProvider` for `qwen serve`.
 * Returns a fresh provider per call; provider is stateless so callers
 * can cache if hot-path overhead matters (currently both methods are
 * called only from the route handlers, so per-request allocation is
 * fine).
 */
export declare function createDaemonStatusProvider(): DaemonStatusProvider;
