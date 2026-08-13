/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FileReadCache } from '../services/fileReadCache.js';
import { ToolErrorType } from './tool-error.js';
export { StructuredToolError } from './tool-error.js';
/**
 * Result of checking whether a tool that mutates an existing file is
 * cleared to proceed based on the session FileReadCache.
 *
 *  - `ok: true` — the model has legitimately read the file in this
 *    session and the on-disk fingerprint still matches.
 *  - `ok: false` — the call must be rejected. `type` selects the
 *    error code; `rawMessage` is the model-facing prose; `displayMessage`
 *    is the short user-facing form.
 *
 * The decision is structured (rather than a `ToolResult` or thrown
 * error) so each caller can route it into the shape its surrounding
 * code expects — a `CalculatedEdit.error` from EditTool's
 * `calculateEdit`, a thrown error from `getConfirmationDetails`, or a
 * `ToolResult` from `execute`.
 */
export type PriorReadDecision = {
    ok: true;
} | {
    ok: false;
    type: ToolErrorType;
    rawMessage: string;
    displayMessage: string;
};
/**
 * Verb used in the user-facing prose ("editing" / "overwriting").
 * Kept as a parameter rather than baked into the tool because EditTool
 * and WriteFileTool word their messages slightly differently and we
 * do not want a future divergence to silently weaken the boundary.
 */
export type PriorReadVerb = 'editing' | 'overwriting';
/**
 * Options for {@link checkPriorRead}.
 *
 *  - `expectExisting`: when true, an `ENOENT` from the stat call
 *    rejects with `FILE_CHANGED_SINCE_READ` instead of returning
 *    `ok: true`. Use this for the post-read and pre-write recheck
 *    calls — at those points the model has already committed to
 *    mutating an existing path, so a disappeared file is a stale-read
 *    drift, not a "the file genuinely never existed" disappearance
 *    race. The default (`expectExisting: false`) is the pre-read
 *    behaviour: ENOENT means "go ahead and create".
 *
 * **Do not re-introduce a `requireFullRead` (or any "stricter for
 * WriteFile than Edit") option here.** PR #3932 added one with the
 * rationale that WriteFile's overwrite path needs more evidence than
 * Edit's `old_string`-matched in-place change; PR #4002 removed it
 * because the truncate-tool-output limit makes "fully read" an
 * impossible precondition on files larger than the limit, producing
 * the deadlock issue #3945 reported. The contract now matches Claude
 * Code's `readFileState`: any prior read clears enforcement for both
 * tools, the mtime/size drift check is the safety net.
 *
 * There is no built-in "stricter than this" mode. `fileReadCacheDisabled:
 * true` is the OPPOSITE — it bypasses the cache (and thus prior-read
 * enforcement) entirely, ceding the safety net to whatever
 * application-level overwrite-protection the operator wires up
 * (lockfiles, content hashing, atomic temp-file rename, etc.). Users
 * who want STRICTER built-in enforcement than the residual #2499 risk
 * accepts have no flag here today; file a feature request.
 *
 * See the docstring on {@link checkPriorRead} for the full rationale
 * and the residual #2499 risk it accepts.
 */
export interface CheckPriorReadOptions {
    expectExisting?: boolean;
}
/**
 * Test whether a mutating tool is cleared to proceed against
 * `filePath` based on the session FileReadCache.
 *
 * Approval requires more than `cache.check === 'fresh'`: the recorded
 * read must also have been (a) stamped with `lastReadAt` and
 * (b) `lastReadCacheable` (i.e. plain text, not binary / image /
 * audio / video / PDF / notebook — those return a structured payload
 * the Edit / WriteFile tools cannot mutate as text).
 *
 * `lastReadCacheable` is purely about content type, not completeness.
 * A truncated or partial text read still records `lastReadCacheable:
 * true` because the bytes the model saw were text. Whether the model
 * has seen *every* byte is recorded on `lastReadWasFull` for the
 * Read fast-path; we do NOT consult it for enforcement, because the
 * truncate-tool-output limit makes "fully read" an impossible
 * precondition on files larger than the limit (issue #3945).
 * Aligning with Claude Code's `readFileState`: any prior read clears
 * enforcement for both Edit and WriteFile; the mtime/size drift
 * check above is the only gate that distinguishes "the model has
 * seen current bytes" from "the model has seen older bytes", and it
 * fires identically for both tools. Issue #2499 (model hallucinates
 * unread bytes on overwrite) is the residual risk this stance
 * accepts, mitigated by the drift check. There is no built-in
 * stricter mode — `fileReadCacheDisabled: true` is an OPT-OUT (it
 * bypasses enforcement entirely so application-level locking can
 * take over), not an opt-in to anything stricter.
 *
 * Stat policy: `ENOENT` means the path disappeared between the
 * caller's `fileExists` check and now — a disappearance race that is
 * harmless for our purposes (the downstream write will resurface the
 * absence as its own error). Any other stat error (`EACCES`, `EBUSY`,
 * NFS hiccup, …) is fail-closed: returning `ok: true` would re-open
 * the blind-write path the helper exists to block, since a transient
 * stat failure does not imply the subsequent read/write will fail.
 *
 * Note on `recordWrite` interaction: when a tool *creates* a file via
 * Edit (`old_string === ''`) or WriteFile (new path), the FileReadCache
 * `recordWrite` call seeds `lastReadAt` / `lastReadCacheable` on the
 * brand-new entry, so a subsequent edit on that same file passes here
 * without an intervening explicit Read. The model authored those bytes;
 * for the purposes of prior-read enforcement that counts as having
 * seen them.
 */
export declare function checkPriorRead(cache: FileReadCache, filePath: string, verb: PriorReadVerb, options?: CheckPriorReadOptions): Promise<PriorReadDecision>;
