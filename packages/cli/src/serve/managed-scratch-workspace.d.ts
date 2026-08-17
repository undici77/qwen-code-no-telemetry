/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type WorkspaceRuntimeProvenance =
  | 'existing'
  | 'managed-scratch'
  | 'live-conversation';
/** Filesystem identity captured when the daemon accepts its private root. */
export interface ManagedScratchRoot {
  readonly canonicalRoot: string;
  readonly device: number;
  readonly inode: number;
}
/** Returns whether a canonical path is a daemon-shaped direct scratch child. */
export declare function isManagedScratchChild(
  canonicalCwd: string,
  canonicalRoot: string,
): boolean;
/**
 * Protects the scratch root from workspace nesting while allowing retained
 * `scratch-*` children to be registered again as ordinary workspaces.
 */
export declare function isScratchRootCompatible(
  canonicalCwd: string,
  canonicalRoot: string,
): boolean;
/**
 * Creates and accepts the daemon's scratch root, recording its identity so
 * later requests can fail closed if the path is replaced.
 */
export declare function prepareManagedScratchRoot(
  root: string,
  startupWorkspaceCwds: readonly string[],
): ManagedScratchRoot;
/** Atomically creates one private, canonical direct child of the accepted root. */
export declare function createManagedScratchDirectory(
  root: ManagedScratchRoot,
): Promise<string>;
