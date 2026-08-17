/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SkillConfig } from './types.js';
export declare const AUTO_SKILL_CURATOR_INTERVAL_MS: number;
export declare const AUTO_SKILL_STALE_AFTER_MS: number;
export declare const AUTO_SKILL_ARCHIVE_AFTER_MS: number;
type AutoSkillState = 'active' | 'stale' | 'archived';
export interface AutoSkillCuratorEntry {
  directoryName: string;
  skillName: string;
  state: AutoSkillState;
  lastActivityAt: string;
  useCount: number;
  pinned: boolean;
}
export interface AutoSkillCuratorStatus {
  lastRunAt?: string;
  active: AutoSkillCuratorEntry[];
  stale: AutoSkillCuratorEntry[];
  archived: AutoSkillCuratorEntry[];
}
export interface AutoSkillCuratorRunResult {
  dryRun: boolean;
  checked: number;
  seeded: string[];
  markedStale: string[];
  reactivated: string[];
  archived: string[];
  skippedCollisions: string[];
  skippedErrors: string[];
}
export type AutoSkillCuratorAutomaticResult =
  | {
      status: 'seeded';
      checked: number;
    }
  | {
      status: 'not_due';
    }
  | {
      status: 'ran';
      result: AutoSkillCuratorRunResult;
    };
export declare function runAutoSkillCurator(
  projectRoot: string,
  options?: {
    dryRun?: boolean;
    now?: Date;
  },
): Promise<AutoSkillCuratorRunResult>;
export declare function maybeRunAutoSkillCurator(
  projectRoot: string,
  now?: Date,
): Promise<AutoSkillCuratorAutomaticResult>;
export declare function recordAutoSkillUsage(
  projectRoot: string,
  skill: Pick<SkillConfig, 'filePath' | 'name' | 'level'>,
  now?: Date,
): Promise<boolean>;
export declare function setAutoSkillPinned(
  projectRoot: string,
  directoryName: string,
  pinned: boolean,
  now?: Date,
): Promise<void>;
export declare function getAutoSkillCuratorStatus(
  projectRoot: string,
  now?: Date,
): Promise<AutoSkillCuratorStatus>;
export declare function restoreArchivedAutoSkill(
  projectRoot: string,
  directoryName: string,
  now?: Date,
): Promise<void>;
export {};
