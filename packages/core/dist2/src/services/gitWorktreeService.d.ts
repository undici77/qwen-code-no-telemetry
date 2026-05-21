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
    private git;
    private readonly customBaseDir?;
    constructor(sourceRepoPath: string, customBaseDir?: string);
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
    createUserWorktree(slug: string, baseBranch?: string): Promise<CreateWorktreeResult>;
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
