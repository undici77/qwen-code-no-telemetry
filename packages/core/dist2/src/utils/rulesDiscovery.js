/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
// Path-based context rule injection.
//
// Discovers .qwen/rules/ files (recursively) with optional YAML frontmatter.
// Rules declare applicable file paths via glob patterns in `paths:`.
//
// - Rules WITHOUT `paths:` always load at session start (baseline rules).
// - Rules WITH `paths:` are deferred and injected on-demand when the model
//   reads or edits a matching file (turn-level lazy loading).
// - HTML comments are stripped to save tokens.
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import picomatch from 'picomatch';
import { parse as parseYaml } from './yaml-parser.js';
import { normalizeContent } from './textUtils.js';
import { QWEN_DIR } from './paths.js';
import { Storage } from '../config/storage.js';
import { createDebugLogger } from './debugLogger.js';
import { resolveProjectRelativePath } from './projectPath.js';
const logger = createDebugLogger('RULES_DISCOVERY');
// ─────────────────────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────────────────────
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/;
function stripHtmlComments(content) {
    // Iteratively strip complete <!-- ... --> pairs so adjacent or
    // malformed-looking sequences (e.g. <!-- A --><!-- B -->) fully clear.
    let result = content;
    let prev;
    do {
        prev = result;
        result = prev.replace(/<!--[\s\S]*?-->/g, '');
    } while (result !== prev);
    // Strip any residual unclosed <!-- markers. Not a security issue in
    // system-prompt context (output isn't rendered as HTML), but leaving
    // them would waste tokens and trip static analyzers (CodeQL flags
    // "incomplete multi-character sanitization" without this step).
    return result.replace(/<!--/g, '');
}
/**
 * Parse a rule file's YAML frontmatter and body content.
 * Returns null if the file has no usable content after processing.
 */
export function parseRuleFile(rawContent, filePath) {
    const normalized = normalizeContent(rawContent);
    const match = normalized.match(FRONTMATTER_REGEX);
    let body;
    let paths;
    let description;
    if (match) {
        const [, frontmatterYaml, rawBody] = match;
        try {
            const frontmatter = parseYaml(frontmatterYaml);
            const pathsRaw = frontmatter['paths'];
            if (Array.isArray(pathsRaw)) {
                paths = pathsRaw.map(String).filter(Boolean);
                if (paths.length === 0)
                    paths = undefined;
            }
            else if (typeof pathsRaw === 'string' && pathsRaw) {
                paths = [pathsRaw];
            }
            if (frontmatter['description'] != null) {
                description = String(frontmatter['description']);
            }
        }
        catch (error) {
            logger.warn(`Failed to parse frontmatter in ${filePath}: ${error}`);
        }
        body = rawBody;
    }
    else {
        body = normalized;
    }
    const content = stripHtmlComments(body).trim();
    if (!content)
        return null;
    return { filePath, description, paths, content };
}
// ─────────────────────────────────────────────────────────────────────────────
// Directory scanning (recursive)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Recursively collect all .md file paths under a directory.
 * Returns sorted absolute paths for deterministic ordering.
 */
async function collectMdFiles(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectMdFiles(fullPath)));
        }
        else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    return files;
}
/**
 * Discover and load rule files from a single `.qwen/rules/` directory.
 * Scans recursively; files are sorted alphabetically for deterministic ordering.
 *
 * @param excludes - Glob patterns to skip (matched against absolute paths).
 */
async function loadRulesFromDir(rulesDir, excludes) {
    const allPaths = await collectMdFiles(rulesDir);
    if (allPaths.length === 0)
        return [];
    // Sort for deterministic ordering. Use Array.sort() default (UTF-16 code
    // point comparison) rather than localeCompare — locale-dependent sorting
    // can produce different orders on machines with different locales.
    allPaths.sort();
    // Compile exclude matchers once
    const excludeMatchers = excludes.length > 0 ? excludes.map((p) => picomatch(p, { dot: true })) : [];
    const ruleFiles = [];
    for (const filePath of allPaths) {
        // Gap 2: check excludes
        if (excludeMatchers.some((m) => m(filePath))) {
            logger.debug(`Excluding rule by setting: ${filePath}`);
            continue;
        }
        try {
            const rawContent = await fs.readFile(filePath, 'utf-8');
            const rule = parseRuleFile(rawContent, filePath);
            if (rule) {
                ruleFiles.push(rule);
            }
        }
        catch (error) {
            logger.warn(`Failed to load rule file ${filePath}: ${error}`);
        }
    }
    return ruleFiles;
}
// ─────────────────────────────────────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Format loaded rules into a single string with source markers,
 * consistent with the `--- Context from: ... ---` format used for QWEN.md.
 */
export function formatRules(rules, projectRoot) {
    return rules
        .map((rule) => {
        const rawDisplayPath = path.isAbsolute(rule.filePath)
            ? path.relative(projectRoot, rule.filePath)
            : rule.filePath;
        // Normalize to forward slashes for cross-platform consistency in the
        // system prompt. Glob patterns in `paths:` use forward slashes, so
        // display paths should match — otherwise Windows shows `.qwen\rules\foo.md`
        // and Linux shows `.qwen/rules/foo.md`, which is confusing in diffs/tests.
        const displayPath = rawDisplayPath.replace(/\\/g, '/');
        return (`--- Rule from: ${displayPath} ---\n` +
            `${rule.content}\n` +
            `--- End of Rule from: ${displayPath} ---`);
    })
        .join('\n\n');
}
/**
 * Registry that holds conditional rules and injects them on-demand when
 * the model accesses a file matching a rule's `paths:` patterns.
 *
 * Each rule is injected at most once per session. Patterns are pre-compiled
 * with picomatch for efficient repeated matching.
 */
export class ConditionalRulesRegistry {
    compiledRules;
    injected = new Set();
    projectRoot;
    constructor(rules, projectRoot) {
        this.projectRoot = projectRoot;
        this.compiledRules = rules.map((rule) => ({
            rule,
            matchers: (rule.paths ?? []).map((p) => picomatch(p, { dot: true })),
        }));
        logger.debug(`ConditionalRulesRegistry created with ${rules.length} rule(s)`);
    }
    /**
     * Check if a file path matches any conditional rules that haven't been
     * injected yet. Matched rules are marked as consumed and their formatted
     * content is returned for injection into the conversation context.
     *
     * @param filePath - Absolute path of the file being accessed.
     * @returns Formatted rule content, or undefined if no new rules match.
     */
    matchAndConsume(filePath) {
        if (this.compiledRules.length === 0)
            return undefined;
        // Shared helper handles `..` outside-root, plus the Windows
        // cross-drive case (where `path.relative('C:\\proj', 'D:\\else')`
        // returns an absolute path that would otherwise normalize to
        // forward slashes and false-match a broad glob like `**/*.ts`).
        // Without this guard the rules registry diverged from
        // SkillActivationRegistry, which had been hardened earlier.
        const relativePath = resolveProjectRelativePath(filePath, this.projectRoot);
        if (relativePath === null) {
            return undefined;
        }
        const newMatches = this.compiledRules.filter(({ rule, matchers }) => {
            if (this.injected.has(rule.filePath))
                return false;
            return matchers.some((m) => m(relativePath));
        });
        if (newMatches.length === 0)
            return undefined;
        for (const { rule } of newMatches) {
            this.injected.add(rule.filePath);
            logger.debug(`Injecting conditional rule: ${rule.filePath}`);
        }
        return formatRules(newMatches.map((m) => m.rule), this.projectRoot);
    }
    get totalCount() {
        return this.compiledRules.length;
    }
    get injectedCount() {
        return this.injected.size;
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────
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
export async function loadRules(projectRoot, folderTrust, excludes = []) {
    logger.debug(`Loading rules for project: ${projectRoot}`);
    const allRules = [];
    // 1. Global rules: <QWEN_HOME or ~/.qwen>/rules/
    const globalRulesDir = path.join(Storage.getGlobalQwenDir(), 'rules');
    const globalRules = await loadRulesFromDir(globalRulesDir, excludes);
    allRules.push(...globalRules);
    logger.debug(`Loaded ${globalRules.length} global rule(s)`);
    // 2. Project-level rules: <projectRoot>/.qwen/rules/  (trusted only)
    //    Skip if it resolves to the same directory as global rules.
    if (folderTrust) {
        const projectRulesDir = path.join(projectRoot, QWEN_DIR, 'rules');
        if (path.resolve(projectRulesDir) !== path.resolve(globalRulesDir)) {
            const projectRules = await loadRulesFromDir(projectRulesDir, excludes);
            allRules.push(...projectRules);
            logger.debug(`Loaded ${projectRules.length} project rule(s)`);
        }
        else {
            logger.debug('Project rules dir same as global — skipping to avoid duplicates');
        }
    }
    // Split into baseline (no paths) and conditional (has paths)
    const baselineRules = [];
    const conditionalRules = [];
    for (const rule of allRules) {
        if (rule.paths) {
            conditionalRules.push(rule);
        }
        else {
            baselineRules.push(rule);
        }
    }
    logger.debug(`Split: ${baselineRules.length} baseline, ${conditionalRules.length} conditional`);
    const content = baselineRules.length > 0 ? formatRules(baselineRules, projectRoot) : '';
    return { content, ruleCount: baselineRules.length, conditionalRules };
}
//# sourceMappingURL=rulesDiscovery.js.map