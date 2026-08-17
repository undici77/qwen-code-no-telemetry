/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Settings } from './settings.js';
export declare const TRUSTED_FOLDERS_FILENAME = 'trustedFolders.json';
export declare function getTrustedFoldersPath(): string;
export declare enum TrustLevel {
  TRUST_FOLDER = 'TRUST_FOLDER',
  TRUST_PARENT = 'TRUST_PARENT',
  DO_NOT_TRUST = 'DO_NOT_TRUST',
}
export interface TrustRule {
  path: string;
  trustLevel: TrustLevel;
}
export interface TrustedFoldersError {
  message: string;
  path: string;
}
export interface TrustedFoldersFile {
  config: Record<string, TrustLevel>;
  path: string;
}
export interface TrustResult {
  isTrusted: boolean | undefined;
  source: 'ide' | 'file' | undefined;
}
export type TrustedFoldersChangeListener = () => void;
export declare function onTrustedFoldersChanged(
  listener: TrustedFoldersChangeListener,
): () => void;
export type WorkspaceTrustState = 'trusted' | 'untrusted' | 'unknown';
export type WorkspaceTrustSource = 'disabled' | 'ide' | 'file' | 'none';
export interface WorkspaceTrustStatus {
  v: 1;
  workspaceCwd: string;
  folderTrustEnabled: boolean;
  effective: {
    state: WorkspaceTrustState;
    source: WorkspaceTrustSource;
  };
  explicitTrustLevel: TrustLevel | null;
  requiresDaemonRestartForChanges: true;
}
export declare class LoadedTrustedFolders {
  readonly user: TrustedFoldersFile;
  readonly errors: TrustedFoldersError[];
  constructor(user: TrustedFoldersFile, errors: TrustedFoldersError[]);
  get rules(): TrustRule[];
  /**
   * Returns true or false if the path should be "trusted". This function
   * should only be invoked when the folder trust setting is active.
   *
   * @param location path
   * @returns
   */
  isPathTrusted(location: string): boolean | undefined;
  setValue(path: string, trustLevel: TrustLevel): void;
}
/**
 * FOR TESTING PURPOSES ONLY.
 * Resets the in-memory cache of the trusted folders configuration.
 */
export declare function resetTrustedFoldersForTesting(): void;
export declare function loadTrustedFolders(): LoadedTrustedFolders;
export declare function saveTrustedFolders(
  trustedFoldersFile: TrustedFoldersFile,
): void;
/** Is folder trust feature enabled per the current applied settings */
export declare function isFolderTrustEnabled(settings: Settings): boolean;
export declare function getExplicitTrustLevel(
  trustConfig: Record<string, TrustLevel>,
  workspaceCwd: string,
): TrustLevel | null;
export declare function getWorkspaceTrustStatus(
  settings: Settings,
  workspaceCwd: string,
  trustConfig?: Record<string, TrustLevel>,
): WorkspaceTrustStatus;
export declare function isWorkspaceTrusted(
  settings: Settings,
  trustConfig?: Record<string, TrustLevel>,
  workspacePath?: string,
): TrustResult;
