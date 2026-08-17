/**
 * @license
 * Copyright 2026 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawn } from 'node:child_process';
interface ManagedNpmUpdate {
  stagingDir: string;
  versionDir: string;
  launcherRoot: string;
  baseVersion: string;
  bootstrapCtimeMs: number;
  installArgs: string[];
}
export declare function prepareManagedNpmUpdate(
  version: string,
  bootstrapPath?: string | undefined,
  updateRoot?: string,
): ManagedNpmUpdate;
export declare function installManagedNpmUpdate(
  version: string,
  bootstrapPath?: string | undefined,
  updateRoot?: string,
  spawnFn?: typeof spawn,
): Promise<void>;
export declare function activateManagedNpmUpdate(
  update: ManagedNpmUpdate,
  version: string,
  bootstrapPath?: string | undefined,
): Promise<void>;
export declare function cleanupManagedNpmUpdate(
  update: ManagedNpmUpdate,
): Promise<void>;
export {};
