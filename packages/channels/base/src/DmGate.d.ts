import type { DmPolicy, Envelope } from './types.js';
export interface DmCheckResult {
  allowed: boolean;
  reason?: 'disabled';
}
export declare class DmGate {
  private policy;
  constructor(policy?: DmPolicy);
  /**
   * DM check: policy gating for private/non-group messages.
   * Evaluation order:
   *   1. Group messages bypass this gate (handled by GroupGate)
   *   2. dmPolicy (disabled → drop)
   *
   * Symmetric with GroupGate — GroupGate owns group messages,
   * DmGate owns DM messages.
   */
  check(envelope: Envelope): DmCheckResult;
}
