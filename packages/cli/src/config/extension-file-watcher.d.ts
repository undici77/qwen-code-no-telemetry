/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import { ExtensionRefreshState } from './extension-refresh-state.js';
export declare class ExtensionFileWatcher {
  private readonly config;
  private readonly extensionsDir;
  private readonly refreshState;
  private watcher?;
  private bootstrapWatcher?;
  private mutationListenerDisposer?;
  private mutationSuppressionEnds;
  private staleFiles;
  private watching;
  private watchGeneration;
  private readonly storeStatePath;
  private generationPoller?;
  private observedStoreGeneration?;
  constructor(
    config: Config,
    extensionsDir?: string,
    refreshState?: ExtensionRefreshState,
    storeStatePath?: string,
  );
  startWatching(): void;
  stopWatching(): void;
  restartWatching(): void;
  private getWatchRoots;
  private getStaleFiles;
  private addManifestFileReference;
  private watchExtensionsParent;
  private getRefreshAction;
  private getUserExtensionRefreshAction;
  private getLinkedExtensionRefreshAction;
  private getRuntimePathRefreshAction;
  private isIgnored;
  private subscribeExtensionManagerMutations;
  private endPendingMutationSuppressions;
  private restartAfterMutation;
  private closeBootstrapWatcher;
  private startGenerationPolling;
  private pollStoreGeneration;
  private markStoreGenerationChanged;
  private readStoreGeneration;
}
