/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { RepositoryContextRoleId } from './agent-briefs.js';
export declare const REPOSITORY_CONTEXT_VERSION: 1;
export declare const MAX_ARRAY_ITEMS = 128;
export declare const MAX_LABEL_LENGTH = 120;
export declare const MAX_TOKEN_LENGTH = 160;
export declare const MAX_PATH_LENGTH = 512;
export declare const MAX_NOTE_LENGTH = 512;
/**
 * Fail-closed ceiling on a single identity read. An identity file is a small
 * marker or manifest; a multi-megabyte one is an attacker payload whose cost
 * lands in `JSON.parse` BEFORE any schema validation can reject it (the
 * parse runs first). Both the worktree reader (stat size) and the parser
 * (content length) enforce this, symmetric in both modes. One megabyte is
 * far beyond any honest manifest and far below the heap damage a
 * near-push-limit file demonstrably causes.
 */
export declare const MAX_IDENTITY_BYTES: number;
export interface RepositoryContext {
    version: typeof REPOSITORY_CONTEXT_VERSION;
    provider: string;
    label: string;
    domains: string[];
    relatedPaths: string[];
    recommendedTests: string[];
    requiredConfigurations: string[];
    requiredAgents: RepositoryContextRoleId[];
    unverifiedDimensions: string[];
    verificationNotes: string[];
}
export interface RepositoryContextPlan {
    repositoryContext?: unknown;
}
export interface RepositoryContextProviderInput {
    worktree: string;
    changedPaths: string[];
    /**
     * Read an identity file the provider keys on. The content is identical in
     * every mode — CRLF normalised to LF, surrounding whitespace trimmed — so a
     * provider that exact-compares a marker file gets the same value in a pull
     * request review (read from the trusted merge base) and a local one (read
     * from the worktree). `null` means the file is absent; a read failure
     * THROWS, fail-closed, so a broken read cannot pose as "not this
     * repository".
     */
    readIdentityFile(relativePath: string): string | null;
}
export interface RepositoryContextProvider {
    provide(input: RepositoryContextProviderInput): RepositoryContext | null;
}
export declare function isControlFree(value: string): boolean;
export declare function compareText(left: string, right: string): number;
export declare function isSafeRepositoryRelativePath(path: string): boolean;
/**
 * Bounded, non-empty, control-character-free string. `prefix` names the owner
 * of the field in the error (`repositoryContext.` for the wire format, the
 * manifest's own wording for manifest parsing), so one validator serves both
 * without their bounds drifting apart.
 */
export declare function validateBoundedString(value: unknown, field: string, maxLength: number, prefix: string, pattern?: RegExp): asserts value is string;
/** Item-shape half of {@link validateBoundedString}; ordering is the caller's. */
export declare function validateBoundedStringArray(value: unknown, field: string, maxLength: number, prefix: string, pattern?: RegExp): asserts value is string[];
/** Validate repository context before any downstream consumer trusts it. */
export declare function validateRepositoryContext(value: unknown): RepositoryContext;
export declare function repositoryContextOf(plan: RepositoryContextPlan): RepositoryContext | null;
