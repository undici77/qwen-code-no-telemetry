/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { SettingScope, type LoadedSettings } from './settings.js';
export interface SkillDisablement {
    reason: 'hard' | 'default';
    lockedScope?: 'system' | 'user' | 'systemDefaults';
}
export type SkillSettingListKey = 'disabled' | 'defaultDisabled' | 'enabled';
export interface ResolvedSkillSettings {
    disabledNames: ReadonlySet<string>;
    defaultDisabledNames: ReadonlySet<string>;
    enabledNames: ReadonlySet<string>;
    disablements: ReadonlyMap<string, SkillDisablement>;
}
interface WorkspaceSkillSettingLists {
    disabled: string[];
    enabled: string[];
}
export declare function normalizeSkillNames(value: unknown): Set<string>;
export declare function skillSettingStrings(settings: LoadedSettings, scope: SettingScope, key: SkillSettingListKey): string[];
export declare function resolveSkillSettings(settings: LoadedSettings): ResolvedSkillSettings;
export declare function updateWorkspaceSkillSettingLists(lists: WorkspaceSkillSettingLists, skillName: string, enabled: boolean, defaultDisabled: boolean): WorkspaceSkillSettingLists;
export interface WorkspaceSkillListToggle {
    name: string;
    wasEnabled: boolean;
    isEnabled: boolean;
    /** Record an explicit `skills.enabled` opt-in when enabling this skill. */
    defaultDisabled: boolean;
}
export interface WorkspaceSkillListUpdates {
    disabled: string[];
    enabled: string[];
    disabledChanged: boolean;
    enabledChanged: boolean;
}
/**
 * Computes the workspace `skills.disabled` / `skills.enabled` lists the skills
 * picker should persist after a set of toggle changes.
 *
 * The seed lists are the workspace's current entries. Locked skills (disabled
 * at a higher scope) are dropped from the seed so we never re-emit redundant
 * entries the higher scope already enforces. Orphaned entries — workspace
 * disables for skills not currently loaded (a different git branch, an
 * uninstalled extension, a deleted skills dir) — are preserved verbatim: only
 * the toggled, currently-loaded skills passed in `toggles` mutate the lists.
 * That preservation is load-bearing; the orphan case is pinned by a test in
 * `skill-settings.test.ts`.
 */
export declare function computeWorkspaceSkillListUpdates(workspaceDisabled: readonly string[], lockedNames: ReadonlySet<string>, workspaceEnabled: readonly string[], toggles: readonly WorkspaceSkillListToggle[]): WorkspaceSkillListUpdates;
export {};
