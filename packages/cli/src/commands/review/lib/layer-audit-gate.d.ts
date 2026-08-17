/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The launch-prompt IDENTITY line of a reverse-audit auditor. `agent-prompt`
 * builds every role's header as `` You are review agent `<role>` — <label> ``,
 * so this anchors on the reverse auditor's own identity rather than a bare
 * `includes('reverse-audit')` substring, which counted any transcript whose
 * prompt merely MENTIONED the role — a verifier inlining reverse-audit findings,
 * a nested subagent writing the same session dir.
 */
export declare const REVERSE_AUDIT_IDENTITY =
  'You are review agent `reverse-audit`';
/** What the reader found: the corroborated auditors' final returns, and how many
 *  identity-matched reverse auditors ran at all (corroborated or not). */
interface AuditorReturns {
  corroborated: string[];
  identityMatched: number;
}
/**
 * The `unreviewedDimensions` entries a modeled-system diff owes for defect
 * layers its reverse audit never walked. `readReturns` is injectable so the gate
 * logic — the domain sentinel, the owed computation — is testable without a
 * transcript dir; the default is the real reader above.
 */
export declare function layerAuditGate(
  planPath: string | undefined,
  env?: NodeJS.ProcessEnv,
  readReturns?: (
    planPath: string,
    env: NodeJS.ProcessEnv,
    diffPath: string | undefined,
  ) => AuditorReturns,
): {
  unreviewed: string[];
};
export {};
