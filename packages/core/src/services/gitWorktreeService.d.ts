/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Prefix applied to every general-purpose worktree branch. */
export declare const WORKTREE_BRANCH_PREFIX = "worktree-";
/** Returns the canonical branch name for a worktree slug. */
export declare function worktreeBranchForSlug(slug: string): string;
/**
 * Filename of the in-worktree session marker. Created at worktree
 * provisioning time and consulted by `exit_worktree` to decide
 * whether the current session is allowed to drop the worktree. The
 * file lives outside the working tree (it is .gitignored as part of
 * `.qwen/worktrees/.gitignore`) so it cannot leak into commits.
 */
export declare const WORKTREE_SESSION_FILE = ".qwen-session";
/** Writes the owning session id into the worktree's session marker. */
export declare function writeWorktreeSessionMarker(worktreePath: string, sessionId: string): Promise<void>;
/**
 * Reads the owning session id stored at worktree provisioning time.
 * Returns `null` when the marker is missing or unreadable — callers
 * decide whether to treat that as "owner unknown, refuse" or "owner
 * unknown, allow with explicit override".
 */
export declare function readWorktreeSessionMarker(worktreePath: string): Promise<string | null>;
/**
 * Commit message used for the baseline snapshot in worktrees.
 * After overlaying the user's dirty state (tracked changes + untracked files),
 * a commit with this message is created so that later diffs only capture the
 * agent's changes — not the pre-existing local edits.
 */
export declare const BASELINE_COMMIT_MESSAGE = "baseline (dirty state overlay)";
/**
 * Default directory and branch-prefix name used for worktrees.
 * Changing this value affects the on-disk layout (`~/.qwen/<WORKTREES_DIR>/`)
 * **and** the default git branch prefix (`<WORKTREES_DIR>/<sessionId>/…`).
 */
export declare const WORKTREES_DIR = "worktrees";
/** Slug prefix used for worktrees created by `AgentTool isolation:'worktree'`. */
export declare const AGENT_WORKTREE_PREFIX = "agent";
/** Number of random hex characters appended after the prefix. */
export declare const AGENT_WORKTREE_HEX_LENGTH = 7;
/** Regex that matches the exact ephemeral-agent slug shape. */
export declare const AGENT_WORKTREE_SLUG_PATTERN: RegExp;
/**
 * Generates a fresh ephemeral-agent slug. Centralised so the format
 * stays in lock-step with {@link AGENT_WORKTREE_SLUG_PATTERN}.
 */
export declare function generateAgentWorktreeSlug(): string;
export interface WorktreeInfo {
    /** Unique identifier for this worktree */
    id: string;
    /** Display name (e.g., model name) */
    name: string;
    /** Absolute path to the worktree directory */
    path: string;
    /** Git branch name for this worktree */
    branch: string;
    /** Whether the worktree is currently active */
    isActive: boolean;
    /** Creation timestamp */
    createdAt: number;
}
export interface WorktreeSetupConfig {
    /** Session identifier */
    sessionId: string;
    /** Source repository path (project root) */
    sourceRepoPath: string;
    /** Names/identifiers for each worktree to create */
    worktreeNames: string[];
    /** Base branch to create worktrees from (defaults to current branch) */
    baseBranch?: string;
    /** Extra metadata to persist alongside the session config */
    metadata?: Record<string, unknown>;
}
export interface CreateWorktreeResult {
    success: boolean;
    worktree?: WorktreeInfo;
    error?: string;
}
export interface WorktreeSetupResult {
    success: boolean;
    sessionId: string;
    worktrees: WorktreeInfo[];
    worktreesByName: Record<string, WorktreeInfo>;
    errors: Array<{
        name: string;
        error: string;
    }>;
}
/**
 * Service for managing git worktrees.
 *
 * Git worktrees allow multiple working directories to share a single repository,
 * enabling isolated environments without copying the entire repo.
 */
export declare class GitWorktreeService {
    private sourceRepoPath;
    private gitPromise;
    private readonly customBaseDir?;
    constructor(sourceRepoPath: string, customBaseDir?: string);
    private getGit;
    /**
     * Gets the directory where worktrees are stored.
     * @param customDir - Optional custom base directory override
     */
    static getBaseDir(customDir?: string): string;
    /**
     * Gets the directory for a specific session.
     * @param customBaseDir - Optional custom base directory override
     */
    static getSessionDir(sessionId: string, customBaseDir?: string): string;
    /**
     * Gets the worktrees directory for a specific session.
     * @param customBaseDir - Optional custom base directory override
     */
    static getWorktreesDir(sessionId: string, customBaseDir?: string): string;
    /**
     * Instance-level base dir, using the custom dir if provided at construction.
     */
    getBaseDirForInstance(): string;
    /**
     * Checks if git is available on the system.
     */
    checkGitAvailable(): Promise<{
        available: boolean;
        error?: string;
    }>;
    /**
     * Resolves the absolute path of the enclosing git repository's top
     * directory. Used by callers that need to anchor general-purpose
     * worktrees at the *repo* root rather than the cwd they were invoked
     * from — otherwise running `qwen` from a monorepo subdirectory would
     * scatter `.qwen/worktrees/` under each subdirectory instead of
     * gathering them under the repo root.
     *
     * Returns the canonical top-level path on success, or `null` when the
     * cwd is not inside a git repo (caller should error).
     */
    getRepoTopLevel(): Promise<string | null>;
    /**
     * Checks if the source path is a git repository.
     */
    isGitRepository(): Promise<boolean>;
    /**
     * Initializes the source directory as a git repository.
     * Returns true if initialization was performed, false if already a repo.
     */
    initializeRepository(): Promise<{
        initialized: boolean;
        error?: string;
    }>;
    /**
     * Gets the current branch name.
     */
    getCurrentBranch(): Promise<string>;
    /**
     * Gets the current commit hash.
     */
    getCurrentCommitHash(): Promise<string>;
    /**
     * Resolves a git ref name to a 40-char commit SHA. Returns `null` when
     * the ref is unknown / unborn / not a commit.
     *
     * Used by Phase D-3 to lock in `FETCH_HEAD` immediately after
     * `fetchPullRequestRef` succeeds, so the SHA passed to
     * `git worktree add` is immutable against a concurrent `git fetch` from
     * another process sharing the same repo, AND so `WorktreeExitDialog`'s
     * `rev-list <originalHeadCommit>..HEAD` counts only THIS session's new
     * work rather than every commit in the fetched PR.
     */
    resolveRef(ref: string): Promise<string | null>;
    /**
     * Creates a single worktree.
     */
    createWorktree(sessionId: string, name: string, baseBranch?: string): Promise<CreateWorktreeResult>;
    /**
     * Sets up all worktrees for a session.
     * This is the main entry point for worktree creation.
     */
    setupWorktrees(config: WorktreeSetupConfig): Promise<WorktreeSetupResult>;
    /**
     * Lists all worktrees for a session.
     */
    listWorktrees(sessionId: string): Promise<WorktreeInfo[]>;
    /**
     * Removes a single worktree.
     */
    removeWorktree(worktreePath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Cleans up all worktrees and branches for a session.
     */
    cleanupSession(sessionId: string): Promise<{
        success: boolean;
        removedWorktrees: string[];
        removedBranches: string[];
        errors: string[];
    }>;
    /**
     * Gets the diff between a worktree and its baseline state.
     * Prefers the baseline commit (which includes the dirty state overlay)
     * so the diff only shows the agent's changes. Falls back to the base branch
     * when no baseline commit exists.
     */
    getWorktreeDiff(worktreePath: string, baseBranch?: string): Promise<string>;
    /**
     * Applies raw changes from a worktree back to the target working directory.
     *
     * Diffs from the baseline commit (which already includes the user's
     * dirty state) so the patch only contains the agent's new changes.
     * Falls back to merge-base when no baseline commit exists.
     */
    applyWorktreeChanges(worktreePath: string, targetPath?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Lists all sessions stored in the worktree base directory.
     */
    static listSessions(customBaseDir?: string): Promise<Array<{
        sessionId: string;
        createdAt: number;
        sourceRepoPath: string;
        worktreeCount: number;
    }>>;
    /**
     * Finds the baseline commit in a worktree, if one exists.
     * Returns the commit SHA, or null if not found.
     */
    private resolveBaseline;
    /** Stages all changes, runs a callback, then resets the index. */
    private withStagedChanges;
    private sanitizeName;
    private pathExists;
    /**
     * Returns the directory holding all general-purpose worktrees for this
     * repo: `<projectRoot>/.qwen/worktrees`.
     */
    getUserWorktreesDir(): string;
    /**
     * Returns the absolute worktree path for a given slug.
     */
    getUserWorktreePath(slug: string): string;
    /**
     * Generates an auto-slug `{adj}-{noun}-{6hex}` for an unnamed worktree.
     *
     * Uses `randomInt` for the word-list indices (uniform by construction
     * via rejection sampling — `randomBytes[i] % len` would be biased
     * whenever `len` doesn't divide `2^8`, and CodeQL's
     * `js/biased-cryptographic-random` rule flags it even when it
     * happens to be exact). Uses `randomBytes` for the suffix because
     * hex encoding of raw bytes is unbiased. ~16M combinations × 8 adj
     * × 8 noun ≈ 1B distinct slugs.
     */
    static generateAutoSlug(): string;
    /**
     * Parses a PR reference from a string. Recognised forms:
     *
     * - `#123` — shorthand PR number
     * - `https://github.com/<owner>/<repo>/pull/123` — full GitHub URL
     *   (any host, any query string, any fragment)
     *
     * Returns the parsed PR number on match, `null` otherwise. The slug for
     * a PR worktree is derived by callers as `pr-<N>` and the branch as
     * `worktree-pr-<N>` (see `createUserWorktree`).
     *
     * Mirrors claude-code's `parsePRReference` (utils/worktree.ts:633) so
     * cross-CLI muscle memory transfers.
     */
    static parsePRReference(input: string): number | null;
    /**
     * Identifies the registered worktree at `worktreePath` as a member of
     * THIS repository (`sourceRepoPath`). Returns the branch + HEAD commit
     * SHA on success, or `null` when the path is not a worktree of this
     * repo.
     *
     * Used by Phase D-1's re-attach path: when `--worktree foo` is passed
     * and `<repoRoot>/.qwen/worktrees/foo` already exists on disk, we
     * verify it really IS a Qwen-managed worktree of the current repo (not
     * a standalone `git init` someone dropped at that path) before
     * assuming it's safe to chdir into. Returning the HEAD SHA in the
     * same call avoids a second subprocess to recapture it after chdir.
     *
     * Implementation — a single `git rev-parse` returning four lines:
     * 1. `HEAD` → the worktree's HEAD commit SHA (must come BEFORE
     *    `--abbrev-ref` since the flag sticks for all subsequent refs).
     * 2. `--abbrev-ref HEAD` → the branch name. A detached HEAD produces
     *    `HEAD` here, which we treat as "no real branch" and return null
     *    — the caller's re-attach gate will then refuse, since the
     *    slug-derived branch couldn't possibly be `HEAD`.
     * 3. `--git-common-dir` → the common `.git` directory. For a real
     *    linked worktree of this repo that's `<sourceRepoPath>/.git`;
     *    for a sibling `git init` it resolves to `<worktreePath>/.git`.
     *    We compare against this repo's own common-dir to reject the
     *    latter.
     * 4. `--show-toplevel` → git's idea of the worktree top. For a real
     *    linked worktree this equals `worktreePath`; for a plain
     *    directory living UNDER the main repo (e.g. `mkdir
     *    <repo>/.qwen/worktrees/foo`) git walks up to the outer `.git`
     *    and returns the OUTER repo's root — which would otherwise pass
     *    the common-dir check and let us "re-attach" to a non-worktree
     *    directory. Compare paths to reject this.
     */
    getRegisteredWorktreeBranch(worktreePath: string): Promise<{
        branch: string;
        headCommit: string;
    } | null>;
    /**
     * Returns true when `worktreePath` is a REGISTERED linked worktree of this
     * repository — i.e. git's own registry entry for it points back at exactly
     * this path — and it is not the repository's primary working tree.
     *
     * Two complementary checks, because neither alone suffices:
     *
     * 1. **Registry** (repo side): some `<commonDir>/worktrees/<name>/gitdir`
     *    must name this path. Everything read here belongs to the repository, so
     *    a candidate cannot forge it — fabricating `<target>/.git` and the git
     *    dir it points at (with its own `commondir`/`gitdir`) only controls
     *    candidate-side files, which are never consulted. This also rejects the
     *    primary working tree, which has no `worktrees/<name>` entry, along with
     *    other repositories' worktrees and a directory carrying a `.git` file
     *    *copied* from a real worktree (the entry names the original, not the
     *    copy).
     * 2. **Liveness** (inside the path): the path's own `--git-dir` must be that
     *    same entry. A registry record survives `rm -rf` of its directory (git
     *    tags it `prunable` and keeps it for gc.worktreePruneExpire, 3 months by
     *    default); if the path is then recreated as an ordinary directory, git
     *    resolves it into the MAIN checkout. The registry answers "is this path
     *    registered?"; only the probe answers "is it a worktree right now?".
     *
     * A `.git`-is-a-file heuristic would misfire here (the main tree also carries
     * a `.git` file under `git clone --separate-git-dir` and in submodules), and
     * reading the registry directly avoids parsing `git worktree list`, whose
     * porcelain form is newline-delimited — and so injectable by a worktree path
     * that itself contains a newline — unless `-z` is used, which needs
     * Git >= 2.36 and would break older git.
     *
     * Fail-closed: any git or I/O error returns false, so a caller that gates
     * isolation on this check rejects an unverifiable path rather than
     * silently pinning a sub-agent to a possibly-main tree.
     */
    isRegisteredLinkedWorktree(worktreePath: string): Promise<boolean>;
    /**
     * Fetches the GitHub PR ref `refs/pull/<N>/head` from the `origin` remote
     * so a subsequent `createUserWorktree(..., 'FETCH_HEAD')` call can branch
     * off the PR's tip (Phase D-3). Returns `{ success: true }` on success,
     * or `{ success: false, error }` with a user-facing reason on failure.
     *
     * Implementation notes:
     *
     * - Uses `git fetch origin pull/<N>/head` (no `gh` CLI dependency).
     * - Hard timeout of 30s by default — overridable for tests. A hung git
     *   process on a misconfigured corporate proxy would otherwise stall
     *   the entire startup sequence.
     * - Does NOT create a local branch — leaves the ref accessible only
     *   via `FETCH_HEAD`. Subsequent `git worktree add -b <branch> <wt>
     *   FETCH_HEAD` materialises the worktree branch off it.
     *
     * Error message taxonomy is friendly because this is the user's first
     * impression when their `--worktree=#<N>` fails:
     * - missing `origin` → tell them the remote is required + how to fix
     * - timeout → mention the configured timeout so they can blame the network
     * - generic failure → "PR may not exist or origin is unreachable"
     */
    fetchPullRequestRef(prNumber: number, options?: {
        timeoutMs?: number;
    }): Promise<{
        success: true;
    } | {
        success: false;
        error: string;
    }>;
    /**
     * Validates a worktree slug. Returns null on success, or an error message.
     *
     * Rules (mirrors claude-code's `validateWorktreeSlug`):
     * - Non-empty, ≤ 64 chars
     * - Only `[a-zA-Z0-9._-]` characters; no path separators
     * - No `..` or leading/trailing dots (would resolve outside the worktrees dir)
     * - Must not start with `agent-`: that prefix is reserved for the
     *   ephemeral worktrees `AgentTool isolation:'worktree'` produces.
     *   The startup sweep auto-removes anything matching
     *   {@link AGENT_WORKTREE_SLUG_PATTERN}, so a user-named
     *   `agent-1234567` would be silently deleted after 30 days along
     *   with any work it contained.
     */
    static validateUserWorktreeSlug(slug: string): string | null;
    /**
     * Creates a general-purpose worktree at `<projectRoot>/.qwen/worktrees/<slug>`
     * with branch `worktree-<slug>`. Used by `EnterWorktreeTool` and
     * `AgentTool isolation:'worktree'`.
     *
     * Refuses to overwrite an existing branch: if `worktree-<slug>` already
     * exists (e.g., from a manual `git checkout -b worktree-foo` or a
     * teammate's push), the call fails with a clear error rather than
     * silently resetting the branch. The previous `-B` form would have
     * dropped any commits unique to that branch — see review #4073.
     */
    createUserWorktree(slug: string, baseBranch?: string, options?: {
        symlinkDirectories?: readonly string[];
    }): Promise<CreateWorktreeResult>;
    /**
     * Configures `core.hooksPath` inside `worktreePath` to point at the main
     * repository's hooks directory. Prefers `.husky/` over `.git/hooks/` to
     * match the convention most JS projects use (husky's prepare script
     * configures `core.hooksPath=.husky` in the main repo).
     *
     * Skips the `git config` write subprocess when the value already
     * matches the desired one — common when this method runs against a
     * worktree that already inherits the same `core.hooksPath` from a
     * prior creation cycle. The probe read itself is still a subprocess
     * (claude-code's `parseGitConfigValue` reads the config file
     * directly to avoid even that, but the read runs once per worktree
     * creation so the extra ~14ms isn't worth the file-parsing complexity).
     */
    private configureHooksPath;
    /**
     * Phase D-2 symlink loop. For each configured directory under the main
     * repository, creates a symbolic link from the new worktree to the
     * main-repo location (`<worktreePath>/<dir>` → `<repoRoot>/<dir>`).
     *
     * Fail-open semantics — the worktree IS already on disk and usable by
     * the time this runs, so a symlink failure must NOT abort the parent
     * `createUserWorktree` call. Per-entry failures are logged at debug or
     * warn level depending on cause:
     *
     * - **ENOENT on source** (the main repo does not have the directory):
     *   debug log, skip. Typical for users who configure `node_modules`
     *   but launch from a fresh clone where `npm install` hasn't run yet.
     * - **EEXIST on destination** (something already lives at the symlink
     *   target inside the worktree): debug log, skip. No overwrite; the
     *   existing content (whether file, dir, or stale link) wins.
     * - **Absolute path or path traversal in the configured value**:
     *   warn log, skip the entry. Configured values must stay relative to
     *   the repo root to prevent a setting from redirecting writes onto
     *   `/etc`, `~`, or anywhere outside the repo subtree.
     * - **Other I/O errors**: warn log, continue to the next entry.
     *
     * Mirrors claude-code's `symlinkDirectories` helper (utils/worktree.ts).
     */
    private symlinkConfiguredDirectories;
    /**
     * Returns true if a local branch with the given name exists.
     *
     * Uses `for-each-ref` because `simple-git.raw` swallows the non-zero
     * exit of `show-ref --quiet` and always resolves with empty stdout —
     * so the previous `show-ref` form would always return `true` and
     * permanently block worktree creation. `for-each-ref` instead prints
     * the ref name when it exists and prints nothing when it does not,
     * always exiting 0, so we can decide on the output.
     *
     * Conservative on error: returns false so the caller's "not exists"
     * fast path attempts the create (which itself will fail loudly if the
     * branch exists for some reason this check missed).
     */
    private localBranchExists;
    /**
     * Ensures `<projectRoot>/.qwen/.gitignore` ignores the worktrees
     * directory. Idempotent: writes only when the file is missing. If the
     * file exists (user may have curated it), this method is a no-op so
     * we never disturb intentional configuration.
     */
    private ensureWorktreesGitignored;
    /**
     * Removes a user worktree, optionally deleting its branch.
     *
     * Branch deletion uses `-d` by default (refuses to drop branches that
     * have commits not merged into HEAD), so a worktree whose tree was
     * left "clean" because the agent committed its work doesn't lose
     * those commits when the cleanup helper sweeps it. Set
     * `forceDeleteBranch: true` to bypass — callers must have already
     * confirmed there is nothing of value on the branch.
     */
    removeUserWorktree(slug: string, options?: {
        deleteBranch?: boolean;
        forceDeleteBranch?: boolean;
    }): Promise<{
        success: boolean;
        error?: string;
        branchPreserved?: boolean;
    }>;
    /**
     * Reports whether the tip of a user worktree's branch is reachable
     * only from itself — i.e. the branch carries commits that no other
     * local branch or remote ref points at, so dropping the branch would
     * silently destroy them. Used by callers that want to decide whether
     * removing the worktree would lose work the subagent committed but
     * never merged or pushed.
     *
     * Fail-closed: returns `true` on any git error so the caller defaults
     * to preserving rather than destroying the worktree.
     */
    hasUnmergedWorktreeCommits(slug: string): Promise<boolean>;
    /**
     * Reports whether a worktree has uncommitted tracked changes (staged or
     * unstaged) or untracked files. Used by `ExitWorktreeTool` to refuse
     * `remove` when the user has work in progress.
     *
     * Fail-closed: returns `true` on any git error so the caller assumes the
     * worktree is dirty rather than risking data loss.
     */
    hasWorktreeChanges(worktreePath: string): Promise<boolean>;
    /**
     * Counts uncommitted file changes in a worktree. Returns null if the
     * worktree can't be inspected (which the caller should treat as "dirty").
     */
    countWorktreeChanges(worktreePath: string): Promise<{
        tracked: number;
        untracked: number;
    } | null>;
}
