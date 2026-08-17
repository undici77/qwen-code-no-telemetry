/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AutoMemoryType } from './types.js';
export interface ScannedAutoMemoryDocument {
  type: AutoMemoryType;
  filePath: string;
  relativePath: string;
  filename: string;
  title: string;
  description: string;
  body: string;
  mtimeMs: number;
}
export declare function parseAutoMemoryTopicDocument(
  filePath: string,
  content: string,
  mtimeMs?: number,
  relativePath?: string,
): ScannedAutoMemoryDocument | null;
export declare function scanAutoMemoryTopicDocuments(
  projectRoot: string,
): Promise<ScannedAutoMemoryDocument[]>;
/**
 * Scan the user-level (cross-project) auto-memory dir. Returns an empty
 * array when the dir does not exist yet, so callers can union with
 * project-level docs unconditionally.
 */
export declare function scanUserAutoMemoryTopicDocuments(): Promise<
  ScannedAutoMemoryDocument[]
>;
/**
 * Scan the team (in-repo, git-tracked) auto-memory dir. Returns an empty
 * array when the dir does not exist yet.
 */
export declare function scanTeamAutoMemoryTopicDocuments(
  projectRoot: string,
): Promise<ScannedAutoMemoryDocument[]>;
