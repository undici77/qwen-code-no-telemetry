/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BridgeFileSystem } from '@qwen-code/acp-bridge';
import type { WorkspaceFileSystemFactory } from './fs/workspace-file-system.js';
interface BridgeFileSystemAdapterOptions {
  /** Same-host daemon wiring only; generic adapters must leave this disabled. */
  allowSameHostToolWritesOutsideWorkspace?: boolean;
}
/**
 * Adapter factory. Pass the existing `WorkspaceFileSystemFactory`
 * (the same instance `createServeApp` / `runQwenServe` build for
 * HTTP fs routes) — delegated operations share the same `fsAuditEmit` channel
 * + trust gate snapshot.
 */
export declare function createBridgeFileSystemAdapter(
  factory: WorkspaceFileSystemFactory,
  options?: BridgeFileSystemAdapterOptions,
): BridgeFileSystem;
export {};
