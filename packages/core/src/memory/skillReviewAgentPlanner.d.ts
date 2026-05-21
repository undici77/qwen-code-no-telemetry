/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Config } from '../config/config.js';
export declare const SKILL_REVIEW_AGENT_NAME: "managed-skill-extractor";
export declare const DEFAULT_AUTO_SKILL_MAX_TURNS = 8;
export declare const DEFAULT_AUTO_SKILL_TIMEOUT_MS = 120000;
export interface SkillReviewExecutionResult {
    touchedSkillFiles: string[];
    systemMessage?: string;
}
export declare function createSkillScopedAgentConfig(config: Config, projectRoot: string): Config;
export declare function runSkillReviewByAgent(params: {
    config: Config;
    projectRoot: string;
    history: Content[];
    maxTurns?: number;
    timeoutMs?: number;
}): Promise<SkillReviewExecutionResult>;
