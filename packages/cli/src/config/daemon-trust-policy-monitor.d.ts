/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonTrustPolicySnapshot } from './daemon-trust-policy.js';
export type DaemonTrustPolicyChangeReason =
  | 'initial'
  | 'poll'
  | 'ide'
  | 'trusted_folders'
  | 'manual';
export interface DaemonTrustPolicyMonitor {
  start(): Promise<void>;
  requestReconcile(reason?: DaemonTrustPolicyChangeReason): Promise<void>;
  stop(): void;
}
export interface DaemonTrustPolicyMonitorOptions {
  readonly onSnapshot: (
    snapshot: DaemonTrustPolicySnapshot,
    reasons: ReadonlySet<DaemonTrustPolicyChangeReason>,
  ) => void | Promise<void>;
  readonly onError?: (error: unknown) => void;
  readonly pollIntervalMs?: number;
  readonly readSnapshot?: () => Promise<DaemonTrustPolicySnapshot>;
}
export declare function createDaemonTrustPolicyMonitor(
  options: DaemonTrustPolicyMonitorOptions,
): DaemonTrustPolicyMonitor;
