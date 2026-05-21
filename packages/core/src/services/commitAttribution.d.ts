/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface FileAttribution {
    /** Total characters contributed by AI (accumulated across edits) */
    aiContribution: number;
    /** Whether the file was created by AI */
    aiCreated: boolean;
    /**
     * SHA-256 of the file content immediately after AI's last write. Used
     * to detect out-of-band mutation (paste-replace via external editor,
     * `rm` + recreate, manual save) so AI's accumulated counter doesn't
     * silently get credited to subsequent human edits. recordEdit checks
     * this on every call (resets when the input `oldContent` doesn't
     * match), and `validateAgainst` re-verifies before a commit note is
     * generated to catch user edits that happened entirely outside the
     * Edit/Write tools.
     */
    contentHash: string;
}
/**
 * Per-file attribution detail in the git notes payload.
 *
 * Field naming caveat: `aiChars` and `humanChars` look like literal
 * UTF-16/UTF-8 character counts, but they are NOT. Both are
 * heuristic diff-size proxies derived from `git diff --numstat`:
 * for text files the value is `(addedLines + deletedLines) × 40`
 * (the 40-char/line heuristic), and for binary files both sides
 * are reported as a flat `1024`. The per-file AI accumulator from
 * `recordEdit` is then clamped against this same line-based ceiling.
 *
 * Practical consequence: a commit adding 1000 one-character lines
 * and one adding 1000 thousand-character lines both report
 * `aiChars = 40000`; a 5 MB image change and a 1-byte binary tweak
 * both report `1024`. `percent` (and `summary.aiPercent`) is
 * largely insulated from this — both numerator and denominator use
 * the same heuristic — but consumers aggregating raw
 * `aiChars`/`humanChars` for compliance reporting will get
 * systematically biased numbers and should treat these fields as
 * "approximate change size in proxy-chars" rather than literal
 * char counts.
 */
export interface FileAttributionDetail {
    /** Heuristic diff-size proxy (NOT a literal char count — see interface doc). */
    aiChars: number;
    /** Heuristic diff-size proxy (NOT a literal char count — see interface doc). */
    humanChars: number;
    /**
     * AI share of the per-file diff, rounded to integer percent.
     * Robust against the heuristic in `aiChars`/`humanChars` because
     * both sides of the ratio use the same proxy; safe to aggregate.
     */
    percent: number;
    surface?: string;
}
/**
 * Full attribution payload stored as git notes JSON.
 *
 * Same `aiChars`/`humanChars` caveat as `FileAttributionDetail`:
 * those summed totals are sums of heuristic diff-size proxies, not
 * literal character counts. `aiPercent` (and per-file `percent`)
 * use the same proxy on both sides of the ratio, so the percentage
 * is the field consumers should rely on for cross-commit
 * aggregation; the raw chars values are useful for ordering
 * commits within the same payload but should not be summed across
 * unrelated commits as if they were byte counts.
 */
export interface CommitAttributionNote {
    version: 1;
    generator: string;
    files: Record<string, FileAttributionDetail>;
    summary: {
        /** AI share of the whole commit, rounded to integer percent. */
        aiPercent: number;
        /** Sum of per-file `aiChars` heuristic proxies (see FileAttributionDetail). */
        aiChars: number;
        /** Sum of per-file `humanChars` heuristic proxies (see FileAttributionDetail). */
        humanChars: number;
        totalFilesTouched: number;
        surfaces: string[];
    };
    surfaceBreakdown: Record<string, {
        aiChars: number;
        percent: number;
    }>;
    /**
     * Sample of generated/vendored files that were excluded from
     * attribution. Capped at `MAX_EXCLUDED_GENERATED_SAMPLE` paths so a
     * commit churning thousands of `dist/` artifacts can't blow past the
     * 30 KB note budget and silently drop attribution for the real
     * source files in the same commit. Use `excludedGeneratedCount` for
     * the true total.
     */
    excludedGenerated: string[];
    /** Total count of excluded files (≥ excludedGenerated.length). */
    excludedGeneratedCount: number;
    promptCount: number;
}
/**
 * Upper bound on the number of excluded-generated paths we serialize
 * into the git note. Keeps the JSON payload bounded for commits with
 * lots of generated artifacts.
 */
export declare const MAX_EXCLUDED_GENERATED_SAMPLE = 50;
/** Result of running git commands to get staged file info. */
export interface StagedFileInfo {
    files: string[];
    diffSizes: Map<string, number>;
    deletedFiles: Set<string>;
    /**
     * Git rename map from old repo-relative path to new repo-relative path.
     * Populated from `git diff --name-status --find-renames`. Used to move
     * pending attribution from the pre-rename absolute key to the post-rename
     * key before payload generation and cleanup.
     */
    renamedFiles: Map<string, string>;
    /**
     * Absolute path of the repository root (`git rev-parse --show-toplevel`).
     * Optional for backward compatibility with synthetic test inputs;
     * production callers should set it so file paths in `files` (which are
     * relative to the repo root) align with absolute paths tracked by the
     * attribution service. When absent, callers may fall back to the
     * configured target directory at the cost of zeroed-out attribution
     * for files outside that directory.
     */
    repoRoot?: string;
}
/**
 * On-disk schema version for AttributionSnapshot. Bump when the shape
 * changes incompatibly so restoreFromSnapshot can refuse / migrate
 * stale payloads instead of silently producing NaN counters or
 * mismatched key shapes.
 */
export declare const ATTRIBUTION_SNAPSHOT_VERSION = 1;
/** Serializable snapshot for session persistence. */
export interface AttributionSnapshot {
    type: 'attribution-snapshot';
    /** Schema version; absent on pre-versioning snapshots, treated as 1. */
    version?: number;
    surface: string;
    fileStates: Record<string, FileAttribution>;
    promptCount: number;
    promptCountAtLastCommit: number;
}
/**
 * Surface label embedded in the git-notes payload. Defaults to `'cli'`
 * for the qwen-code CLI; embedders (IDE extensions, SDK consumers) can
 * override by setting `QWEN_CODE_ENTRYPOINT` before construction so the
 * note records where the contribution was authored.
 */
export declare function getClientSurface(): string;
export declare class CommitAttributionService {
    private static instance;
    /** Per-file AI contribution tracking (keyed by absolute path) */
    private fileAttributions;
    /** Client surface (cli, ide, api, sdk, etc.) */
    private surface;
    private promptCount;
    private promptCountAtLastCommit;
    private constructor();
    static getInstance(): CommitAttributionService;
    /** Reset singleton for testing. */
    static resetInstance(): void;
    /**
     * Record an AI edit to a file.
     * Uses prefix/suffix matching for precise character-level contribution.
     *
     * `filePath` is canonicalised via `fs.realpathSync` before being used
     * as a key, so symlinked paths (e.g. `/var/...` ↔ `/private/var/...`
     * on macOS) collapse to the same entry instead of silently producing
     * two parallel records.
     *
     * Divergence detection: if a tracked entry's recorded `contentHash`
     * doesn't match the hash of the `oldContent` we received here, the
     * file was changed out-of-band between AI's last write and this
     * call (paste-replace via external editor, `git checkout`, manual
     * save, ...). Reset `aiContribution` and `aiCreated` to 0/false
     * before applying the new edit so prior AI work that the user
     * since overwrote isn't credited to the next commit.
     */
    recordEdit(filePath: string, oldContent: string | null, newContent: string): void;
    /**
     * Re-hash each tracked file's content via a caller-supplied reader
     * and drop entries whose hash doesn't match what AI's last write
     * recorded. Catches the cases recordEdit's input-hash check can't
     * see — i.e. the user (or another tool) modified the file entirely
     * outside the Edit/Write tools, then committed it. Without this,
     * the AI's stale aiContribution would attach to the human-only
     * diff at commit time and credit AI for human work.
     *
     * `getContent(absPath)` returns the bytes the caller wants to
     * compare against, or `null` if the entry shouldn't be checked
     * (deletion, unreadable, file not in the relevant scope). Returning
     * `null` leaves the entry alone rather than dropping it.
     *
     * Production caller (`attachCommitAttribution`) passes a reader
     * that fetches the COMMITTED blob (`git show HEAD:<rel>`) for files
     * actually in the just-made commit, returning null for everything
     * else. The "committed blob" choice (rather than the live working
     * tree) is what makes a `git add AI's edit && extra unstaged edits
     * && git commit` flow correctly attribute the commit to AI even
     * though the working-tree file no longer matches AI's recorded
     * hash.
     */
    validateAgainst(getContent: (absPath: string) => string | null): void;
    incrementPromptCount(): void;
    getPromptCount(): number;
    /** Prompts since last commit (for "N-shotted" display). */
    getPromptsSinceLastCommit(): number;
    getAttributions(): Map<string, FileAttribution>;
    getFileAttribution(filePath: string): FileAttribution | undefined;
    hasAttributions(): boolean;
    getSurface(): string;
    /**
     * Clear file attribution data. Called after commit (success or failure).
     * @param commitSucceeded If true, also updates the "at last commit"
     *   counters so getPromptsSinceLastCommit() resets to 0.
     */
    clearAttributions(commitSucceeded?: boolean): void;
    /**
     * Clear attribution data for the specific files that just landed in
     * a commit, leaving entries for files the user *didn't* include
     * (partial commits, `git add A && git commit -m "..."`) intact so
     * they're still credited on a later commit. Snapshots prompt
     * counters since a commit did succeed.
     *
     * Inputs must already be canonical absolute paths. The caller
     * should resolve repo-relative diff entries against a canonical
     * (realpath'd) repo root rather than realpathing each leaf — at
     * cleanup time the leaf for a just-deleted file no longer exists,
     * so per-leaf `fs.realpathSync` would fail and fall back to a
     * non-canonical path that misses the stored canonical key.
     */
    clearAttributedFiles(committedAbsolutePaths: Set<string>): void;
    /**
     * Snapshot the prompt counter as the new "last commit" without
     * clearing per-file attribution. Used when a commit landed but we
     * can't reliably determine which files were in it (multi-commit
     * chain we won't write a note for, attribution toggle off, diff
     * analysis failed). Wholesale-clearing in those branches would
     * silently wipe pending AI edits for *unrelated* files the user
     * didn't stage — a worse failure mode than the small risk of
     * stale per-file state for files that did just land.
     */
    noteCommitWithoutClearing(): void;
    /**
     * Resolve a set of repo-relative file paths to the canonical absolute
     * keys actually stored in the attribution map. Used by cleanup to
     * partial-clear only the files that just landed in a commit.
     *
     * Matching by walking `fileAttributions` (instead of resolving each
     * relative path with `path.resolve` + `fs.realpathSync`) is the only
     * approach that handles all of: deleted files (where realpathSync
     * throws), intermediate-symlink directories (where path.resolve only
     * canonicalises the base), and renamed files (where the diff-time
     * relative path differs from the recordEdit-time absolute path —
     * still no match here, that's a rename-tracking concern handled
     * separately). Each tracked key is canonical (recordEdit ran it
     * through `realpathOrSelf`), so its computed relative form against
     * the canonical repo root is what generateNotePayload uses too.
     */
    matchCommittedFiles(relativeFiles: Iterable<string>, canonicalRepoRoot: string): Set<string>;
    /**
     * Move pending attribution across git renames before matching committed files.
     *
     * `recordEdit` stores attribution by canonical absolute path at edit time.
     * If the user later commits `git mv old.ts new.ts`, git reports the committed
     * file as `new.ts` while our map is still keyed by `old.ts`. Without moving
     * the key first, the note either misses the AI-authored rename entirely or
     * treats the old path as a deletion depending on diff settings.
     */
    applyCommittedRenames(renamedFiles: ReadonlyMap<string, string>, canonicalRepoRoot: string): void;
    /** Serialize current state for session persistence. */
    toSnapshot(): AttributionSnapshot;
    /** Restore state from a persisted snapshot. */
    restoreFromSnapshot(snapshot: AttributionSnapshot): void;
    /**
     * Generate the git notes JSON payload by combining tracked AI contributions
     * with staged file information from git.
     */
    generateNotePayload(stagedInfo: StagedFileInfo, baseDir: string, generatorName?: string): CommitAttributionNote;
}
/**
 * Compute the character contribution for a file modification.
 * Uses common prefix/suffix matching to find the actual changed region,
 * then returns the larger of the old/new changed lengths.
 */
export declare function computeCharContribution(oldContent: string, newContent: string): number;
