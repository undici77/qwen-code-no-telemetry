/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { AppEvent } from '../utils/events.js';
export declare const EXTENSION_RELOAD_FAILED_REASON = 'extension reload failed';
export declare class ExtensionRefreshState {
  private readonly events;
  private extensionRefreshNeeded;
  private reloadInProgress;
  private changedDuringReload;
  private contentChangedDuringReload;
  private suppressionDepth;
  private suppressUntil;
  constructor(events?: EventEmitter<[never]>);
  on(event: AppEvent, listener: (...args: unknown[]) => void): void;
  off(event: AppEvent, listener: (...args: unknown[]) => void): void;
  markExtensionsChanged(reason?: string): boolean;
  markExtensionContentChanged(reason?: string): boolean;
  clearExtensionsChanged(): void;
  notifyExtensionsReloadStarted(): void;
  markExtensionsReloadFailed(reason?: string): void;
  needsExtensionRefresh(): boolean;
  isSuppressed(): boolean;
  isReloadInProgress(): boolean;
  beginSuppression(onSettle?: () => void): () => void;
  suppressNotifications<T>(fn: () => T, onSettle?: () => void): T;
  resetForTesting(): void;
}
