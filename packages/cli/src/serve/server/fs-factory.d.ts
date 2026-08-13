/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BridgeEvent } from '@qwen-code/acp-bridge/eventBus';
import { type WorkspaceFileSystemFactory } from '../fs/index.js';
import type { PathMutexRegistry } from '../fs/path-mutex-registry.js';
import type { WorkspaceGenerationGuard } from '../workspace-registry.js';
/**
 * Build a no-op fs-audit emitter that logs a warning every
 * `WARN_EVERY` dropped events. The default factory uses this so a
 * regression that silently strips audit events shows up in operator
 * logs instead of disappearing. `runQwenServe` replaces this with a
 * real per-session emit, so legitimate production traffic never hits
 * the warning.
 */
export declare function createDefaultFsAuditEmit(): (event: BridgeEvent) => void;
/**
 * Shared `WorkspaceFileSystemFactory` construction used by both
 * `runQwenServe` and `createServeApp`'s default bridge wiring.
 * Centralizes the "use the injected factory if provided, otherwise
 * build one with the given trust + audit-emit posture" logic.
 *
 * Trust is intentionally a **required** parameter — the two call
 * sites have different correct defaults:
 *   - `runQwenServe` defaults to `trusted: true`
 *   - `createServeApp` defaults to `trusted: false` (test-safe)
 */
export declare function resolveBridgeFsFactory(input: {
    boundWorkspaces: readonly string[];
    injected?: WorkspaceFileSystemFactory;
    trusted: boolean;
    emit?: (event: BridgeEvent) => void;
    customIgnoreFiles?: string[];
    pathLocks?: PathMutexRegistry;
    generationGuard?: Pick<WorkspaceGenerationGuard, 'assertOpen'>;
}): WorkspaceFileSystemFactory;
export declare function resolveBoundWorkspacesFromIdeEnv(primaryWorkspace: string, ideWorkspacePath?: string | undefined, includeWorkspace?: (workspace: string, index: number) => boolean): string[];
