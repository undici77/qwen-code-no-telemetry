/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { TrustLevel, type WorkspaceTrustSource, type WorkspaceTrustState } from './trustedFolders.js';
export type DaemonTrustPolicyErrorCode = 'trust_policy_invalid' | 'trust_policy_unreadable';
export interface DaemonTrustPolicyError {
    readonly code: DaemonTrustPolicyErrorCode;
    readonly path: string;
    readonly message: string;
}
export interface DaemonTrustPolicySnapshot {
    readonly revision: string;
    readonly folderTrustEnabled: boolean;
    readonly ideTrust: boolean | undefined;
    readonly trustedFolders: Readonly<Record<string, TrustLevel>>;
    readonly settingsError?: DaemonTrustPolicyError;
    readonly trustedFoldersError?: DaemonTrustPolicyError;
}
export interface DaemonWorkspaceTrustDecision {
    readonly state: WorkspaceTrustState | 'error';
    readonly targetTrusted: boolean;
    readonly source: WorkspaceTrustSource;
    readonly explicitTrustLevel: TrustLevel | null;
    readonly error?: DaemonTrustPolicyError;
}
export declare function readDaemonTrustPolicySnapshot(): Promise<DaemonTrustPolicySnapshot>;
export declare function evaluateDaemonWorkspaceTrust(snapshot: DaemonTrustPolicySnapshot, workspaceCwd: string, processCwd?: string): DaemonWorkspaceTrustDecision;
