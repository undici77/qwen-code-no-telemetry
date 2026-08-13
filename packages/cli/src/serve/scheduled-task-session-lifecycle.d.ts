/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Disables every ENABLED task bound to one of `sessionIds` (archived sessions),
 * marking it `disabledByArchive` so unarchive only re-enables tasks the archive
 * itself paused — a task the user deliberately disabled (already `enabled:false`,
 * no flag) is left untouched and stays disabled across the cycle.
 */
export declare function disableTasksForSessions(projectRoot: string, sessionIds: string[]): Promise<void>;
/**
 * Re-enables tasks bound to one of `sessionIds` (unarchived sessions) that were
 * disabled BY the archive (`disabledByArchive`) — NOT tasks the user disabled
 * themselves. Clears the flag and resets a recurring task's anchor to `now` so
 * it resumes from now rather than catching up fires it "missed" while archived.
 * (The bound session becomes live again on the next session load / daemon
 * rehydration; until then the re-enabled task simply won't fire.)
 */
export declare function enableTasksForSessions(projectRoot: string, sessionIds: string[], now?: number): Promise<void>;
/** Removes every task bound to one of `sessionIds` (deleted sessions). */
export declare function removeTasksForSessions(projectRoot: string, sessionIds: string[]): Promise<void>;
