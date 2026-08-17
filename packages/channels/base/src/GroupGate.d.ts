import type { GroupPolicy, GroupConfig, Envelope } from './types.js';
import type {
  CreatePairingRequestResult,
  PairingStore,
} from './PairingStore.js';
export interface GroupCheckResult {
  allowed: boolean;
  reason?:
    | 'disabled'
    | 'not_allowlisted'
    | 'mention_required'
    | 'pairing_trigger_required'
    | 'pairing_required';
  /** Set when the check denies with `pairing_required` (a pairing request was created or reused). */
  pairing?: CreatePairingRequestResult;
}
export declare class GroupGate {
  private policy;
  private groups;
  private pairingStore;
  constructor(
    policy?: GroupPolicy,
    groups?: Record<string, GroupConfig>,
    pairingStore?: PairingStore,
  );
  /**
   * Full group check: policy + allowlist + pairing + mention gating.
   * Evaluation order:
   *   1. groupPolicy (disabled → drop)
   *   2. group allowlist (allowlist mode, no match → drop)
   *   3. group pairing (pairing mode, group not approved → drop; an explicit
   *      mention or reply creates or returns a pending pairing request unless
   *      `options.createPairingRequest` is false)
   *   4. mention gating (requireMention + not mentioned → drop silently)
   *
   * Under the pairing policy the pairing step itself drops ambient
   * (unmentioned, non-reply) messages before any request is created. Mention
   * gating then runs before the sender gate so unmentioned messages in
   * approved groups don't trigger sender pairing flows.
   */
  check(
    envelope: Envelope,
    options?: {
      createPairingRequest?: boolean;
    },
  ): GroupCheckResult;
  isGroupApproved(groupId: string): boolean;
}
