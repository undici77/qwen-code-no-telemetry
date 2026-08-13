/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
export type ReviewEffort = 'low' | 'medium' | 'high';
export type ReviewTarget = {
    type: 'pr-number';
    number: number;
} | {
    type: 'pr-url';
    /** Canonicalized: lowercased scheme and host, query/fragment dropped. */
    url: string;
    host: string;
    owner: string;
    repo: string;
    number: number;
} | {
    type: 'file';
    path: string;
} | {
    type: 'local';
};
export interface ParsedReviewArgs {
    target: ReviewTarget;
    /** Resolved effort after defaults and the `--comment` override. */
    effort: ReviewEffort;
    effortSource: 'explicit' | 'default' | 'forced-by-comment' | 'forced-by-fix';
    comment: {
        /** `--comment` appeared in the arguments. */
        requested: boolean;
        /** `--comment` applies (the target is a PR). */
        effective: boolean;
    };
    /**
     * `--fix`: apply the confirmed findings to the working tree after reporting.
     *
     * Deliberately the mirror image of `--comment`, and gated on the opposite
     * targets. `--comment` writes to a pull request, so it needs a PR; `--fix`
     * writes to a **working tree**, so it needs one the user keeps. A PR review's
     * tree is the ephemeral worktree `fetch-pr` creates and Step 9 deletes — edits
     * there are discarded minutes later, and the one thing worse than not fixing
     * the findings is reporting that they were fixed into a directory that no
     * longer exists. So on a PR target `--fix` is ignored with a warning, exactly
     * as `--comment` is on a local one.
     */
    fix: {
        /** `--fix` appeared in the arguments. */
        requested: boolean;
        /** `--fix` applies (the target has a durable working tree). */
        effective: boolean;
    };
    /** Non-flag tokens beyond the first target token, reported not guessed. */
    extraTokens: string[];
    /** Unrecognized `--flags`, reported not guessed. */
    unknownFlags: string[];
    warnings: string[];
}
export declare const EFFORT_LEVELS: ReadonlySet<string>;
/**
 * Split a raw argument string on whitespace, honouring double- and
 * single-quoted segments so file paths with spaces survive.
 */
export declare function tokenizeArgs(raw: string): string[];
export declare function parseReviewArgs(raw: string): ParsedReviewArgs;
export declare const parseArgsCommand: CommandModule;
