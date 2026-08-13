/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export interface RuleFile {
    filePath: string;
    description?: string;
    paths?: string[];
    content: string;
}
export interface LoadRulesResponse {
    /** Formatted baseline rules (no `paths:`) for the system prompt. */
    content: string;
    /** Number of baseline rules injected at session start. */
    ruleCount: number;
    /** Conditional rules (with `paths:`) for turn-level lazy injection. */
    conditionalRules: RuleFile[];
}
/**
 * Parse a rule file's YAML frontmatter and body content.
 * Returns null if the file has no usable content after processing.
 */
export declare function parseRuleFile(rawContent: string, filePath: string): RuleFile | null;
/**
 * Format loaded rules into a single string with source markers,
 * consistent with the `--- Context from: ... ---` format used for QWEN.md.
 */
export declare function formatRules(rules: RuleFile[], projectRoot: string): string;
/**
 * Registry that holds conditional rules and injects them on-demand when
 * the model accesses a file matching a rule's `paths:` patterns.
 *
 * Each rule is injected at most once per session. Patterns are pre-compiled
 * with picomatch for efficient repeated matching.
 */
export declare class ConditionalRulesRegistry {
    private readonly compiledRules;
    private readonly injected;
    private readonly projectRoot;
    constructor(rules: RuleFile[], projectRoot: string);
    /**
     * Check if a file path matches any conditional rules that haven't been
     * injected yet. Matched rules are marked as consumed and their formatted
     * content is returned for injection into the conversation context.
     *
     * @param filePath - Absolute path of the file being accessed.
     * @returns Formatted rule content, or undefined if no new rules match.
     */
    matchAndConsume(filePath: string): Promise<string | undefined>;
    get totalCount(): number;
    get injectedCount(): number;
}
/**
 * Load rules from both global (`~/.qwen/rules/`) and project-level
 * (`.qwen/rules/`) directories.
 *
 * Baseline rules (no `paths:`) are returned in `content` for immediate
 * injection into the system prompt. Conditional rules (with `paths:`) are
 * returned separately in `conditionalRules` for turn-level lazy loading.
 *
 * @param projectRoot - Absolute path to the project root (git root or CWD).
 * @param folderTrust - Whether the project folder is trusted.
 * @param excludes - Glob patterns to skip (matched against absolute paths).
 */
export declare function loadRules(projectRoot: string, folderTrust: boolean, excludes?: string[]): Promise<LoadRulesResponse>;
