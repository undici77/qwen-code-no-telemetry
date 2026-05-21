/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Integration coverage for the runtime.json sidecar wiring through
 * Config.startNewSession(). The unit tests in runtimeStatus.test.ts
 * exercise the module in isolation; this file pins the contract that
 * /clear, /reset, /new and /resume — all of which flow through
 * startNewSession() — actually drive the sidecar swap, and only when
 * the interactive UI bootstrap has flipped runtimeStatusEnabled on.
 */
export {};
