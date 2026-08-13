/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Where a skill finds the arguments it was invoked with. */
export declare const SKILL_ARGS_DIR: string;
/**
 * The current session id.
 *
 * Prefers the async-local `sessionIdContext` over the process-global
 * `QWEN_CODE_SESSION_ID`, and in that order for a reason: in daemon mode a single
 * process serves many sessions, the env var holds whichever `Config` booted
 * first, and each turn binds its own session through `sessionIdContext.run(...)`.
 * Reading only the env would make a later session write under the first
 * session's name while `submit` — a subprocess whose shell env the daemon sets
 * from the async-local value (see `getShellContextEnvVars`) — reads a different
 * one. Both sides must agree, so both read the same context first.
 *
 * Empty string when neither is set (a bare `node dist/cli.js`), which just means
 * one un-scoped directory.
 */
export declare function currentSessionId(): string;
/**
 * Directory holding this session's skill-args files.
 *
 * The session scope lives in the **directory**, not the filename, so the file is
 * always `qwen-skill-args-<skill>.txt` — a stable name the skill prompt and the
 * cleanup step can reference without knowing the session id. A concurrent review
 * in another session writes into a different directory, so the two do not race,
 * and a stale file from an earlier session sits under that session's directory
 * where this run never looks.
 */
export declare function skillArgsDir(sessionId?: string): string;
/**
 * Path of the args file for `skillName` in this session.
 *
 * Session-scoped by its directory (see `skillArgsDir`). Per-skill within that,
 * so two skills in one session cannot read each other's arguments. Sanitised
 * because the skill name becomes a filename: `../../etc/passwd` must not choose
 * where the CLI writes.
 */
export declare function skillArgsPath(skillName: string, sessionId?: string): string;
/**
 * Write a skill's raw arguments to its args file. Returns the path, or null if
 * the write failed.
 *
 * **Never throws.** A read-only checkout, a full disk, a sandbox with no write
 * access — none of those should stop a skill from running. The skill degrades to
 * what it did before this existed (the model reads the arguments from the
 * conversation), which is worse but not broken, so a failure here is logged and
 * swallowed rather than taking the invocation down with it.
 */
export declare function writeSkillArgs(skillName: string, args: string): string | null;
/**
 * Remove this skill's args file for the session.
 *
 * A bare `/review` records no arguments, so it never calls `writeSkillArgs` — and
 * `O_TRUNC` only truncates a file that is being written. Without this, an
 * argument-bearing `/review 6771 --comment` followed by a bare `/review` in the
 * same session leaves the authorised record intact, and the later run reuses the
 * earlier one's posting authority. The bare path calls this to erase it.
 *
 * Returns true when the record is gone, false when it could not be removed —
 * the caller must treat false as "authority not revoked", not proceed as if it
 * were. Never throws.
 */
export declare function clearSkillArgs(skillName: string): boolean;
/**
 * What the skill is told when a bare invocation could not erase the previous
 * run's argument record.
 *
 * The stale record still authorises whatever it names, and `submit` will still
 * read it. The skill must not treat this run as unauthorised-by-default when the
 * evidence on disk says otherwise — it has to know the record it may be judged
 * against is not this invocation's.
 */
export declare function staleArgsWarning(): string;
/**
 * The note appended to the skill body telling it where its arguments are.
 *
 * The arguments themselves are still appended to the prompt by the caller — a
 * skill that only needs to *read* them should not have to open a file. This adds
 * the path for the skills that need them as data.
 */
export declare function skillArgsNote(path: string, args: string): string;
