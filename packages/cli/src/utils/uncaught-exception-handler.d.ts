/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function isExpectedPtyRaceError(error: unknown): boolean;
/**
 * The process-level `uncaughtException` handler registered at the entry point,
 * before the session ID (and thus the debug-log path) is known. Benign PTY
 * teardown races are suppressed; anything else is reported to stderr and fatal.
 *
 * `setupUncaughtExceptionHandler` in gemini.tsx removes this handler and
 * installs a session-aware replacement once interactive startup is far enough
 * along to leave the alternate screen and write the debug file. Exactly one
 * listener must be active: two would conflict (the first calls `process.exit`
 * before the second runs) and this basic one lacks the visibility behavior.
 */
export declare function handleUncaughtException(error: unknown): void;
