/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * `MultiClientPermissionMediator` — implementation of the
 * `PermissionMediator` contract from `./permission.ts`.
 *
 * Owns ALL pending and resolved permission state for the bridge.
 * `httpAcpBridge.ts` no longer keeps `pendingPermissions: Map` or
 * `resolvedPermissions: LRU` — those are inside this class.
 *
 * Strategy dispatch: a single class with `switch (entry.policy)` inside
 * `vote()`. Per-policy logic stays small (5–15 lines each); strategy
 * sub-classes would be more boilerplate than substance.
 *
 *
 */
import { type PermissionMediator, type PermissionPolicy, type PermissionRequestRecord, type PermissionResolution, type PermissionVote, type PermissionVoteOutcome } from './permission.js';
import { type BridgeEvent } from './eventBus.js';
/**
 * Sentinel `optionId` value the bridge maps voter `{outcome:'cancelled'}`
 * to before calling `mediator.vote`. The mediator recognizes this and
 * resolves the pending as `{kind:'cancelled', reason:'agent_cancelled'}`
 * regardless of the active policy.
 *
 * **Bridge-side precondition**: callers MUST NOT forward an incoming
 * `vote.optionId === CANCEL_VOTE_SENTINEL` from a wire client — the
 * mediator treats the sentinel as cancel intent without consulting the
 * `allowedOptionIds` set, so wire-originated sentinel votes would
 * silently flip a real approval into a cancel. The bridge constructs
 * the sentinel only from a `{outcome:'cancelled'}` ACP body that
 * carries no `optionId` of its own.
 *
 * **Cross-policy escape hatch (intentional)**: cancel routes BEFORE
 * policy dispatch. A non-loopback voter under `local-only` and a
 * not-in-voter-set client under `consensus` can both still resolve the
 * pending as cancelled by posting `{outcome:'cancelled'}`. This is
 * deliberate — voter-cancel is the agent-side abort path; if the
 * threat model required policy-gated cancel, that would be a future
 * contract change. Documented here so a future maintainer doesn't
 * "fix" the bypass.
 *
 * **Collision defense**: `mediator.request` rejects records whose
 * `allowedOptionIds` contains the sentinel by throwing
 * `CancelSentinelCollisionError` so an agent legitimately publishing
 * `'__cancelled__'` as an option label can't masquerade as cancel.
 */
export declare const CANCEL_VOTE_SENTINEL: "__cancelled__";
/**
 * Structured "why did this resolve like that?" record attached to
 * audit `permission.resolved` events. Borrowed from claude-code's
 * `PermissionDecisionReason`.
 *
 * **Wire-vs-audit overload note**: `'agent-cancelled'` and
 * `'voter-cancelled'` both project to the same wire shape
 * (`PermissionResolution { kind:'cancelled', reason:'agent_cancelled' }`)
 * because the ACP protocol doesn't distinguish them. The discrimination
 * lives only in the audit log — useful for forensics, invisible on the
 * bus. Deliberately preserves this overload to avoid breaking the
 * frozen `permission.ts` contract.
 *
 * `resolverClientId: string | undefined` on `'first-responder'`,
 * `'local-only-loopback'`, and `'voter-cancelled'` is undefined when
 * the resolving voter connected over loopback without a registered
 * `X-Qwen-Client-Id` header — a legitimate path for the local TUI
 * default flow. The field is required-but-nullable rather than
 * optional to force callers to think about the loopback case.
 */
export type PermissionDecisionReason = {
    readonly type: 'first-responder';
    readonly resolverClientId: string | undefined;
} | {
    readonly type: 'designated-originator';
    readonly originatorClientId: string;
} | {
    readonly type: 'consensus-quorum';
    readonly resolvedOptionId: string;
    readonly quorum: number;
    readonly tally: number;
} | {
    readonly type: 'local-only-loopback';
    readonly resolverClientId: string | undefined;
} | {
    readonly type: 'timeout';
    readonly issuedAtMs: number;
    readonly timeoutMs: number;
    /** `deps.now()` at timer fire — distinct from `issuedAtMs +
     *  timeoutMs` under load (timer queue scheduling delay). */
    readonly firedAtMs: number;
} | {
    readonly type: 'session-closed';
}
/** Agent cancelled the underlying prompt before any voter resolved
 *  the permission. Wire shape collides with `'voter-cancelled'`. */
 | {
    readonly type: 'agent-cancelled';
}
/** A voter posted `{outcome:'cancelled'}`. Wire shape collides with
 *  `'agent-cancelled'`. */
 | {
    readonly type: 'voter-cancelled';
    readonly resolverClientId: string | undefined;
};
/**
 * Audit sink the mediator writes to. Implementation lives in
 * `packages/cli/src/serve/permission-audit.ts` and writes into an
 * in-memory bounded ring on the bridge — NOT onto the SSE bus
 * (audit records and SSE wire events are intentionally separate
 * channels by design).
 *
 * The mediator depends only on this interface, so unit tests can
 * substitute a no-op or a recording stub without dragging the host
 * package's audit ring in.
 */
export interface PermissionAuditPublisher {
    recordRequested(record: PermissionRequestRecord, policy: PermissionPolicy, votersAtIssue: ReadonlySet<string>): void;
    recordVoted(record: PermissionRequestRecord, vote: PermissionVote, outcome: PermissionVoteOutcome): void;
    recordForbidden(record: PermissionRequestRecord, vote: PermissionVote, reason: 'designated_mismatch' | 'remote_not_allowed'): void;
    recordResolved(record: PermissionRequestRecord, resolution: PermissionResolution, decisionReason: PermissionDecisionReason): void;
    recordTimeout(record: PermissionRequestRecord): void;
}
/**
 * No-op `PermissionAuditPublisher` used as the bridge's default when
 * the host omits `BridgeOptions.permissionAudit`. Production
 * `qwen serve` provides a ring-backed publisher; embedded callers and
 * unit tests that don't care about audit can let the bridge fall back
 * here. Single canonical fallback prevents stub-vs-prod divergence
 * (single canonical fallback).
 */
export declare function createNoOpPermissionAuditPublisher(): PermissionAuditPublisher;
/**
 * Dependency hooks the mediator needs from its host (the bridge).
 * Plumbed through `MultiClientPermissionMediator`'s constructor; tests
 * pass a stub.
 */
export interface MediatorDeps {
    /**
     * Best-effort fan-out of a wire event onto the per-session SSE bus.
     * The mediator passes `sessionId` explicitly so the bridge can route
     * to `byId.get(sessionId)?.events.publish(event)` without reverse-
     * lookup. If the entry is gone (session torn down between issue and
     * emit), the bridge silently drops; the audit record still lands.
     */
    emit: (sessionId: string, event: Omit<BridgeEvent, 'id' | 'v'>) => void;
    /** Audit ring writer. */
    audit: PermissionAuditPublisher;
    /**
     * Optional fixed quorum for `consensus`. When set, capped to
     * `M = votersAtIssue.size` to prevent unreachable quorum. When
     * unset, mediator computes `floor(M/2) + 1`.
     */
    consensusQuorum?: number;
    /** Wallclock supplier — injectable for deterministic tests. Used by
     *  the timeout decision-reason `firedAtMs` field. */
    now: () => number;
    /**
     * Snapshot of registered voter `clientId`s for the session at the
     * moment of `request()`. The mediator captures this into
     * `MediatorPending.votersAtIssue`; consensus rejects votes from
     * `clientId`s not in the snapshot.
     *
     * Implementation: `(sid) => new Set(byId.get(sid)?.clientIds.keys() ?? [])`.
     * Refcount is intentionally NOT exposed.
     *
     * **MUST return synchronously**. `mediator.request()` calls this
     * inside the Promise executor with no `await`, per the N1
     * race-prevention invariant. An async implementation (returning
     * `Promise<ReadonlySet<string>>`) would defer the pending registration
     * past the bridge's `publish → register → await` sequencing point and
     * silently break a `forgetSession` racing with the issue path.
     *
     * **Forward-compat trap**: when the session was torn down between
     * the bridge's `publish` and the mediator's `request` (extremely
     * narrow race), the implementation should return an empty Set
     * rather than throw. The `first-responder` policy ignores the
     * snapshot, so an empty set is harmless.
     * Under `consensus` policy, an empty `votersAtIssue` means EVERY vote on
     * the request gets rejected for "not in voter set" — the request
     * can only resolve via `forgetSession` cleanup or `permissionTimeoutMs`.
     * The bridge's torn-down-session race is short enough that this is
     * acceptable; document if a longer-window source of empty-voter
     * snapshots emerges.
     *
     * **Late-joiner timing window** (voter snapshot timing).
     * The bridge sequence is `entry.events.publish(...)` →
     * (synchronous) → `await mediator.request(record, ...)`. The
     * publish is synchronous (`EventBus.publish` returns after fanning
     * to in-memory subscriber queues, no event-loop yield) and the
     * mediator's Promise executor is also synchronous through this
     * call (synchronous-register invariant), so a NEW HTTP client cannot register its
     * `clientId` on `entry.clientIds` between publish and snapshot.
     * However, an SSE subscriber that connected BEFORE the publish but
     * has NOT yet hit any session route (no `X-Qwen-Client-Id` known
     * to the bridge) will not appear in the snapshot — `consensus`
     * silently rejects its later vote as `forbidden`. UIs that surface
     * the active voter set (eligible-voters chip) should treat
     * `permission_request` as the authoritative cutoff, not subsequent
     * client-identity registrations. This version does not surface
     * `votersAtIssue` to the wire; future PRs that add an
     * `eligibleVoters[]` field on `permission_request.data` should
     * source it from the same snapshot to keep client-side and
     * server-side membership decisions aligned.
     */
    votersForSession: (sessionId: string) => ReadonlySet<string>;
}
/**
 * Multi-client permission coordination implementation.
 *
 * Lifecycle:
 *   - `request(record, timeoutMs)` synchronously registers a pending
 *     entry inside the returned Promise's executor (no `await` before
 *     register — see synchronous-register invariant) and arms the timeout.
 *   - `vote(vote)` dispatches by `entry.policy` and either resolves,
 *     records, rejects, or reports unknown.
 *   - `forgetSession(sessionId)` cancels every pending matching the
 *     session as `{kind:'cancelled', reason:'session_closed'}`.
 *
 * State is mediator-owned: `pending: Map<requestId, MediatorPending>`
 * and `resolved: BoundedMap<requestId, PermissionResolutionRecord>`.
 * Outside callers (the bridge) keep ONLY `entry.pendingPermissionIds`
 * for the per-session cap check; the mediator is the source of truth.
 */
export declare class MultiClientPermissionMediator implements PermissionMediator {
    readonly policy: PermissionPolicy;
    private readonly deps;
    private readonly pending;
    private readonly resolved;
    private readonly resolvedOrder;
    /**
     * Dedup flag for the
     * unanimity-required stderr breadcrumb. Without this, every
     * permission request on a 2-client consensus session would emit
     * an identical line (the unanimity condition is the NORMAL
     * operating mode for M=2, not a rare edge); a busy session with
     * many tool calls would produce dozens of duplicate stderr lines
     * within seconds. One emit per mediator (= per bridge/runtime lifetime
     * since each bridge constructs one) is enough to make the
     * configuration visible without spam.
     */
    private unanimityBreadcrumbEmitted;
    constructor(policy: PermissionPolicy, deps: MediatorDeps);
    /**
     * Register a fresh permission request from the agent.
     *
     * **Promise contract — once the Promise is returned, it never
     * rejects.** All runtime failure modes (timeout, session closure,
     * voter cancel, emit/audit publisher exceptions) are encoded as
     * `PermissionResolution { kind:'cancelled', reason:... }`.
     * Consumers can `await` the returned Promise and forward the
     * result without a `.catch()` block.
     *
     * **Synchronous-throw exception**:
     * when the agent's `allowedOptionIds` contains the
     * cancel-vote sentinel string, this method throws
     * `CancelSentinelCollisionError` synchronously BEFORE constructing
     * the Promise. The synchronous shape is intentional — a
     * never-settling Promise alongside a thrown error would be worse
     * than a clean fail-fast — but callers must wrap this method
     * itself in `try/catch` (or call it from an `async` function so
     * the throw bubbles via the function's own Promise machinery).
     * `bridgeClient.ts` currently has its own pre-check at the bridge
     * layer; embedded callers must do the same. See `@throws` below.
     *
     * **Synchronous-register invariant**: pending entry, audit
     * record, and timer setup all happen inside the Promise executor
     * without `await`. The bridge's `publish → mediator.request → await`
     * sequence relies on this — a `forgetSession` between publish and
     * await would otherwise miss the new pending and leak it until
     * timeout.
     *
     * @throws `CancelSentinelCollisionError` SYNCHRONOUSLY (not as a
     *   Promise rejection) if `record.allowedOptionIds` contains the
     *   cancel-vote sentinel string. This is a contract violation
     *   between agent and daemon and fails loudly at issue time
     *   rather than silently miscounting votes downstream. Callers
     *   inside an `async` function get the thrown error through the
     *   function's own Promise; synchronous callers must use
     *   `try/catch`.
     */
    request(record: PermissionRequestRecord, timeoutMs: number): Promise<PermissionResolution>;
    vote(vote: PermissionVote): PermissionVoteOutcome;
    forgetSession(sessionId: string): void;
    /**
     * Lookup the sessionId for a given requestId. Used by the legacy
     * `bridge.respondToPermission(requestId, ...)` route which doesn't
     * carry a sessionId in the URL. NOT part of the
     * `PermissionMediator` interface contract — bridge holds the
     * concrete class reference and calls this directly.
     */
    peekSessionFor(requestId: string): string | undefined;
    /**
     * Daemon-wide in-flight pending count for diagnostics. The bridge
     * exposes this through its `pendingPermissionCount` getter so
     * operators can spot stuck FIFOs without reaching into mediator
     * internals. NOT part of the `PermissionMediator` interface
     * contract.
     */
    get pendingCount(): number;
    private voteFirstResponder;
    private voteDesignated;
    private voteConsensus;
    /**
     * Vote dispatch for `local-only` policy: only `fromLoopback: true`
     * voters can resolve a permission.
     *
     * **Cancel-sentinel asymmetry** (cancel-sentinel note).
     * `vote()` recognizes the cancel sentinel BEFORE calling this
     * method (cross-policy escape hatch — see the
     * `CANCEL_VOTE_SENTINEL` JSDoc for the rationale), so a remote
     * voter under `local-only` CAN abort a pending permission via
     * `{outcome:'cancelled'}` even though they cannot RESOLVE one. The
     * settings-side description for `local-only` and the design doc call
     * out this gap explicitly. Operators who want strict-cancel-too
     * semantics must (a) deploy a dedicated daemon process at
     * loopback bind, OR (b) wait for the follow-up PR that lifts
     * cancel into per-policy gating; This version keeps the current
     * cross-policy cancel for consistency with first-responder /
     * designated / consensus.
     */
    private voteLocalOnly;
    private resolveWithVote;
    private rejectForbidden;
    /**
     * Compute the quorum size for a `consensus` request. Default
     * `floor(M/2) + 1` of `votersAtIssue.size`; overridden by
     * `deps.consensusQuorum` when set, capped to `M` so an operator
     * misconfig (N > M) can't deadlock.
     *
     * When the cap fires, write
     * a one-time stderr breadcrumb per request so operators don't
     * have to diff their `policy.consensusQuorum` against
     * `votersAtIssue.size` manually to understand why a quorum
     * resolved sooner than configured. Tracked on `MediatorPending`
     * so the breadcrumb fires once even though `consensusQuorumFor`
     * may be called multiple times per request (vote tally + final
     * resolution).
     */
    private consensusQuorumFor;
    private totalTalliedFor;
    /**
     * `votesNeeded` = `quorum - max(tally per option)`. When no
     * option has any votes (degenerate; `permission_partial_vote`
     * is only emitted AFTER the first vote, so this should never
     * appear on the wire), returns `quorum` itself. Always ≥ 1
     * because the resolved-on-quorum path returns before this
     * helper runs.
     */
    private votesNeededFor;
    private optionTalliesFor;
    /**
     * Settle a pending entry. Cleanup order is hardened (cleanup-order invariant):
     *   1. clearTimeout (so a timer can never fire on a half-cleaned entry).
     *   2. Delete from `pending` (state-first half — entry no longer
     *      reachable for new votes).
     *   3. emit wire `permission_resolved` (best-effort — emit failures
     *      do not block the Promise settle). MUST come before step 4
     *      so a re-entrant subscriber synchronously casting another
     *      vote during emit sees `pending === undefined && resolved
     *      === undefined` (silent false), matching the previous ordering.
     *
     *   4. write to `resolved` (the second half of state move — late
     *      voters arriving after this see `permission_already_resolved`).
     *   5. audit.recordResolved (best-effort, same).
     *   6. Settle the Promise (LAST — callbacks running re-entrantly
     *      see consistent state).
     *
     * Previously the spec bundled
     * "delete pending + write resolved" into step 2 ahead of emit,
     * which contradicted the code. The fix
     * splits the two halves of the state move around the emit so
     * the spec faithfully describes the ordering invariant.
     *
     * @param resolverClientId  wire compat: the
     *   `permission_resolved` SSE frame stamps this as
     *   `originatorClientId`. The previous `resolvePending` in
     *   `httpAcpBridge.ts:1518-1523` filled it from the voter's
     *   trusted clientId. We preserve byte-for-byte; vote-driven
     *   paths pass `vote.clientId` (which may be undefined for
     *   loopback no-header voters); timer + session-closed paths
     *   pass undefined (no voter).
     */
    private resolveEntry;
    private rememberResolved;
    private safeEmit;
    /**
     * Emit a stderr breadcrumb
     * for every vote rejection (the three forbidden paths in
     * voteDesignated / voteConsensus / voteLocalOnly). Mirrors the
     * timeout breadcrumb pattern: audit ring + SSE event are
     * transient observability surfaces (no v1 query route, SSE drops
     * on disconnect), so an operator tailing daemon stderr would see
     * zero indication of permission rejections without this.
     *
     * Wrapped in `try/catch` because `process.stderr.write` can
     * synchronously throw on EPIPE during shutdown — a stderr
     * unavailability must not propagate up through `safeEmit` /
     * `safeAudit` and break the resolveEntry cleanup ladder. Mirrors
     * the safeEmit/safeAudit defensive posture (see the
     * matching hang scenario in safeEmit).
     */
    private writeForbiddenStderr;
    /**
     * Run an audit-publisher call defensively. The audit ring is
     * best-effort observability — a publisher exception (ring full,
     * host bug, transient I/O) MUST NOT throw out of `request()`,
     * `vote()`, or the timer callback. Without this guard, the
     * Promise the agent is awaiting would be left unsettled and the
     * pending entry would leak.
     *
     * Single helper used at all five audit call sites so the
     * "audit is best-effort" invariant is uniformly enforced (the
     * pre-fix asymmetric `try/catch` at 2 of 5 sites was a real
     * silent-failure hole.
     *
     * doc placement — JSDoc was previously
     * stacked above `writeForbiddenStderr` so IDE hover and API
     * doc generation showed the wrong attribution. Moved adjacent
     * to its actual definition.
     */
    private safeAudit;
    private toRecord;
    private toAcpOutcome;
}
