/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fsSync from 'fs';
import type { SkillConfig, SkillLevel, ListSkillsOptions, SkillValidationResult } from './types.js';
import { SkillError } from './types.js';
import type { Config } from '../config/config.js';
export declare const WATCHER_MAX_DEPTH = 2;
export declare function watcherIgnored(filePath: string, stats?: fsSync.Stats): boolean;
/**
 * Manages skill configurations stored as directories containing SKILL.md files.
 * Provides discovery, parsing, validation, and caching for skills.
 */
export declare class SkillManager {
    private readonly config;
    private skillsCache;
    private readonly changeListeners;
    private slashReloadSuppressed;
    private parseErrors;
    private readonly watchers;
    private watchStarted;
    private refreshTimer;
    private readonly bundledSkillsDir;
    private activationRegistry;
    constructor(config: Config);
    /**
     * Adds a listener that will be called when skills change. Listeners may
     * return a Promise, which `notifyChangeListeners` will await before
     * resolving — callers (e.g. `matchAndActivateByPath`) can therefore wait
     * for downstream consumers like `SkillTool.refreshSkills()` to apply the
     * updated state before continuing.
     * @returns A function to remove the listener.
     */
    addChangeListener(listener: () => void | Promise<void>): () => void;
    /**
     * Public re-entry into the change-listener pipeline for non-disk events,
     * specifically when the user toggles `skills.disabled` via the
     * `/skills` dialog. The underlying
     * `SKILL.md` files have not changed, so `refreshCache` is unnecessary —
     * we just need every consumer (`SkillTool.refreshSkills`, the slash
     * command list reload bridged in `slashCommandProcessor`) to re-read its
     * derived state with the updated disabled set.
     *
     * Returns when every listener has either resolved or hit its 30s
     * timeout, matching the disk-change path's semantics.
     */
    notifyConfigChanged(): Promise<void>;
    /**
     * Tell the next `notifyChangeListeners()` (typically via
     * `notifyConfigChanged`) that callers which would otherwise reload the
     * slash-command surface as a side effect should skip it — the caller has
     * already done that work explicitly. One-shot: consumed by the next
     * `consumeSlashReloadSuppression()` and reset to `false`.
     *
     * Used by the `/skills` dialog: it calls `reloadCommands()` BEFORE
     * `notifyConfigChanged()` to enforce the provider-registration ordering
     * that `SkillTool.refreshSkills` depends on. Without this signal, the
     * `slashCommandProcessor` change-listener would trigger a second
     * `reloadCommands()` (one awaited by the dialog, one orphaned by the
     * fire-and-forget listener), doubling CommandService rebuild cost per
     * save. Listeners that DON'T reload commands are unaffected — they
     * still fire normally.
     */
    suppressNextSlashReload(): void;
    /**
     * Read-and-clear: returns `true` exactly once if the suppression flag
     * was set, then resets it. Listeners that opt into respecting the
     * signal call this in their handler.
     */
    consumeSlashReloadSuppression(): boolean;
    /**
     * Notifies all registered change listeners and awaits any returned
     * promises. Sync listeners resolve immediately; async listeners (e.g.
     * `SkillTool.refreshSkills`) hold the activation pipeline until their
     * downstream validation state is refreshed, so by the time the inline
     * activation reminder is appended the runtime already accepts the newly
     * activated skill.
     *
     * Listeners run in parallel via `Promise.allSettled`. They're
     * independent reads (each rebuilds its own derived state from the
     * shared registry); serializing them used to make `matchAndActivateByPaths`
     * scale linearly with the number of registered listeners — a real
     * cost since per-subagent SkillTool instances each register one.
     * `allSettled` (not `Promise.all`) so a single listener throwing
     * still lets the others finish.
     */
    private notifyChangeListeners;
    /**
     * Gets any parse errors that occurred during skill loading.
     * @returns Map of skill paths to their parse errors.
     */
    getParseErrors(): Map<string, SkillError>;
    /**
     * Lists all available skills.
     *
     * @param options - Filtering options
     * @returns Array of skill configurations
     */
    listSkills(options?: ListSkillsOptions): Promise<SkillConfig[]>;
    /**
     * Returns the currently committed cache without triggering discovery.
     *
     * Status and diagnostics callers must use this method instead of
     * `listSkills()` so a read-only request cannot turn a cold cache into a
     * filesystem scan. `null` means no refresh has committed yet.
     */
    getCachedSkills(level?: SkillLevel): SkillConfig[] | null;
    private collectCachedSkills;
    /**
     * Loads a skill configuration by name.
     * If level is specified, only searches that level.
     * If level is omitted, searches in precedence order: project > user > extension > bundled.
     *
     * @param name - Name of the skill to load
     * @param level - Optional level to limit search to
     * @returns SkillConfig or null if not found
     */
    loadSkill(name: string, level?: SkillLevel): Promise<SkillConfig | null>;
    /**
     * Loads a skill with its full content, ready for runtime use.
     * This includes loading additional files from the skill directory.
     *
     * @param name - Name of the skill to load
     * @param level - Optional level to limit search to
     * @returns SkillConfig or null if not found
     */
    loadSkillForRuntime(name: string, level?: SkillLevel): Promise<SkillConfig | null>;
    /**
     * Validates a skill configuration.
     *
     * @param config - Configuration to validate
     * @returns Validation result
     */
    validateConfig(config: Partial<SkillConfig>): SkillValidationResult;
    /**
     * Refreshes the skills cache by loading all skills from disk.
     */
    refreshCache(): Promise<void>;
    /**
     * Whether the given skill is currently eligible to appear in the SkillTool
     * listing. Unconditional skills are always eligible; conditional skills
     * become eligible only after a tool invocation touches a file matching
     * their `paths:` globs.
     */
    isSkillActive(skill: SkillConfig): boolean;
    /**
     * Activate any conditional skills whose `paths:` globs match `filePath`.
     * Returns the names of skills newly activated by this call. When at least
     * one skill activates, change listeners are notified and awaited — so by
     * the time this method resolves, downstream consumers (notably
     * `SkillTool.refreshSkills` updating validation state) have applied the
     * new state. Callers can therefore announce the activation in the same
     * turn without racing against stale validation data.
     *
     * The activation registry reference is captured at call entry; if a
     * concurrent `refreshCache` rebuilds the registry mid-call, this
     * invocation finishes against the registry it started with, so a
     * returned name is consistent with the listener state that's about to
     * be observed.
     */
    matchAndActivateByPath(filePath: string): Promise<string[]>;
    /**
     * Batch variant of {@link matchAndActivateByPath}: activate skills for
     * an array of file paths and fire change listeners exactly once across
     * all of them. Used by `coreToolScheduler` so a single tool call that
     * names N paths (e.g. ripGrep with multiple `paths:` entries) does not
     * trigger N successive `SkillTool.refreshSkills` listener round-trips.
     */
    matchAndActivateByPaths(filePaths: readonly string[]): Promise<string[]>;
    /** Names of all conditional skills activated so far (read-only snapshot). */
    getActivatedSkillNames(): ReadonlySet<string>;
    /**
     * Starts watching skill directories for changes.
     */
    startWatching(): Promise<void>;
    /**
     * Stops watching skill directories for changes.
     */
    stopWatching(): void;
    /**
     * Parses a SKILL.md file and returns the configuration.
     *
     * @param filePath - Path to the SKILL.md file
     * @param level - Storage level
     * @returns SkillConfig
     * @throws SkillError if parsing fails
     */
    parseSkillFile(filePath: string, level: SkillLevel): Promise<SkillConfig>;
    /**
     * Internal implementation of skill file parsing.
     */
    private parseSkillFileInternal;
    /**
     * Parses skill content from a string.
     *
     * @param content - File content
     * @param filePath - File path for error reporting
     * @param level - Storage level
     * @returns SkillConfig
     * @throws SkillError if parsing fails
     */
    parseSkillContent(content: string, filePath: string, level: SkillLevel): SkillConfig;
    /**
     * Parses hooks configuration from frontmatter.
     *
     * @param hooksRaw - Raw hooks object from frontmatter
     * @returns Parsed SkillHooksSettings
     */
    private parseHooksConfig;
    /**
     * Parses a single hook matcher configuration.
     *
     * @param matcher - Raw matcher object
     * @returns HookDefinition or null if invalid
     */
    private parseHookMatcher;
    /**
     * Gets the base directory for skills at a specific level.
     *
     * @param level - Storage level
     * @returns Absolute directory paths
     */
    getSkillsBaseDirs(level: SkillLevel): string[];
    /**
     * Lists skills at a specific level.
     *
     * @param level - Storage level to scan
     * @returns Array of skill configurations
     */
    private listSkillsAtLevel;
    loadSkillsFromDir(baseDir: string, level: SkillLevel): Promise<SkillConfig[]>;
    /**
     * Finds a skill by name at a specific level.
     *
     * @param name - Name of the skill to find
     * @param level - Storage level to search
     * @returns SkillConfig or null if not found
     */
    private findSkillByNameAtLevel;
    /**
     * Ensures the cache is populated for a specific level without loading other levels.
     */
    private ensureLevelCache;
    private updateWatchersFromCache;
    private scheduleRefresh;
    private ensureUserSkillsDir;
}
