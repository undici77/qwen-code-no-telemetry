/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export type WorkspaceRememberContextMode = 'workspace' | 'clean';
export type WorkspaceRememberScope = 'user' | 'project';
export interface ManagedRememberResult {
  summary?: string;
  filesTouched: string[];
  touchedScopes: WorkspaceRememberScope[];
}
export declare function buildManagedRememberPrompt(
  fact: string,
  projectRoot?: string,
  options?: {
    wrapUserContent?: boolean;
  },
): string;
export declare function buildBareRememberPrompt(fact: string): string;
export declare function runManagedRememberByAgent(params: {
  config: Config;
  projectRoot: string;
  content: string;
  contextMode: WorkspaceRememberContextMode;
  abortSignal?: AbortSignal;
}): Promise<ManagedRememberResult>;
