/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const DEVICE_FLOW_DEFAULT_INTERVAL_MS = 5000;
export declare const DEVICE_FLOW_TERMINAL_GRACE_MS: number;
export declare const DEVICE_FLOW_SWEEP_INTERVAL_MS = 30000;
export declare const DEVICE_FLOW_MAX_CONCURRENT = 4;
export declare const DEVICE_FLOW_SLOW_DOWN_BUMP_MS = 5000;
/**
 * Hard ceiling on `provider.persist()`. A wedged disk I/O (NFS stall,
 * encrypted-volume contention) without this would leave a flow stuck
 * in `pending` until the sweeper catches the upstream `expires_in` —
 * potentially minutes. 30s is generous for a normal local FS write
 * but short enough that operators see disk problems quickly.
 * PR #4255 review C3.
 */
export declare const DEVICE_FLOW_PERSIST_TIMEOUT_MS = 30000;
/**
 * Hard ceiling on `provider.start()`. A hung IdP (network partition,
 * unresponsive `requestDeviceAuthorization` endpoint) without this
 * would leave the per-`providerId` slot in `inFlightStarts` occupied
 * forever, blocking ALL subsequent `POST /workspace/auth/device-flow`
 * requests for the same provider until daemon restart. 30s matches
 * `DEVICE_FLOW_PERSIST_TIMEOUT_MS` and is well over typical IdP
 * round-trip times for `device/code` (sub-second on a healthy IdP).
 * PR #4255 review fold-in 3 (#2).
 */
export declare const DEVICE_FLOW_START_TIMEOUT_MS = 30000;
/**
 * Hard ceiling on a single `provider.poll()` tick. Symmetric with
 * `DEVICE_FLOW_START_TIMEOUT_MS` and `DEVICE_FLOW_PERSIST_TIMEOUT_MS`,
 * which already bound their respective phases. PR #4255 follow-up
 * review thread (deepseek-v4-pro): a hung IdP token endpoint (TCP
 * established, no response) without this would block the registry's
 * poll-tick promise indefinitely. The entry's `cancelController.signal`
 * is the cooperative path; this race makes the timeout authoritative
 * regardless of provider cooperation. The sweeper would still evict
 * the entry once `expiresAt` is past, but until then the per-provider
 * singleton stays occupied with no other recovery short of daemon
 * restart. 30s is the same generosity the start/persist phases use
 * and is well over a healthy IdP's polling round-trip.
 */
export declare const DEVICE_FLOW_POLL_TIMEOUT_MS = 30000;
/**
 * Operator-safe upper bound on the IdP-provided `expires_in`. RFC
 * 8628 §6.1 calls 5–30 minutes "reasonable"; 1 hour is the practical
 * ceiling for any well-behaved IdP. PR #4255 fold-in 7 review thread
 * #3: `Number.isFinite + > 0` keeps NaN/Infinity out, but a malicious
 * or buggy IdP returning `1e12` still pins the per-provider singleton
 * for years and ties up an entry slot the entire time. Clamping
 * silently bounds the worst case to 1 hour — an IdP that genuinely
 * needs longer is not RFC 8628 compliant.
 */
export declare const DEVICE_FLOW_MAX_EXPIRES_IN_SEC: number;
/**
 * Operator-safe lower bound on the IdP-provided `expires_in`.
 * Symmetric with `DEVICE_FLOW_MAX_EXPIRES_IN_SEC`. PR #4255 round-12
 * #5 (gpt-5.5 review Cy_ZF): a misbehaving / fuzzed IdP returning
 * `expires_in: 0.5` would produce `expiresAt = now() + 500 ms` —
 * the very first poll (clamped at `>=1 s`) would fire AFTER
 * `expiresAt` and the entry would expire before any user could
 * authorize. RFC 8628 §3.2 calls 5–30 minutes "reasonable"; sub-30 s
 * `expires_in` is effectively non-compliant. Floor lifts those
 * pathological values to 30 s so the user gets at least one
 * chance to complete the IdP page.
 */
export declare const DEVICE_FLOW_MIN_EXPIRES_IN_SEC = 30;
/**
 * Upper bound on the polling interval. RFC 8628's normal `interval`
 * + `slow_down` bumps live in the 5–30 s range; values past 60 s
 * indicate an IdP misbehaving (or, more likely, `1e12` from a
 * fuzzed/buggy response). Capping keeps `setTimeout` from being
 * scheduled with a value that Node's scheduler clamps to
 * `TIMEOUT_MAX` (≈24.8 d) — at which point the poll never fires
 * within the entry's `expiresAt` window. PR #4255 fold-in 7 review
 * thread #3.
 */
export declare const DEVICE_FLOW_MAX_INTERVAL_MS = 60000;
export declare const DEVICE_FLOW_SUPPORTED_PROVIDERS: readonly ["qwen-oauth"];
export type DeviceFlowProviderId = (typeof DEVICE_FLOW_SUPPORTED_PROVIDERS)[number];
export type DeviceFlowStatus = 'pending' | 'authorized' | 'expired' | 'error' | 'cancelled';
/**
 * Terminal error classifications surfaced on `auth_device_flow_failed`.
 *
 * RFC 8628 §3.5 defines the upstream error codes for the polling
 * endpoint; the daemon adds one daemon-internal kind (`persist_failed`)
 * for the disk-write phase. Keep these mutually exclusive — a
 * mis-classification (e.g. routing a network error into
 * `invalid_grant`) drives operators toward the wrong remediation.
 */
export type DeviceFlowErrorKind = 
/** RFC 8628: device_code has aged out (`expires_in` elapsed
 *  upstream) before user authorization. Recovery: re-issue
 *  `client.auth.start`; daemon also surfaces this kind on its own
 *  time-based sweep when the entry's `expiresAt` passes. */
'expired_token'
/** RFC 8628: user explicitly rejected the authorization at the
 *  IdP page. Recovery: re-issue with consent, or surface the
 *  refusal back to the human. */
 | 'access_denied'
/** RFC 8628: protocol-level violation — `device_code` /
 *  `client_id` / PKCE verifier didn't validate. Treat as a
 *  programmer error in the daemon's flow construction (the user
 *  can't fix this themselves). */
 | 'invalid_grant'
/** Catch-all for IdP-side failures that don't map to an RFC 8628
 *  code: network errors, malformed JSON, 5xx responses, unknown
 *  error codes. Distinguished from `persist_failed` by the LOCATION
 *  of the failure (upstream HTTP vs daemon-local disk). */
 | 'upstream_error'
/** Daemon-local: the IdP exchange succeeded, but the daemon could
 *  not durably store the credentials (EACCES, EROFS, ENOSPC, etc.).
 *  Distinct from `upstream_error` so operators can route remediation
 *  to disk / permissions rather than chasing an IdP outage. The
 *  `device_code` was consumed upstream, so the user must
 *  `client.auth.start` again after fixing the underlying disk
 *  condition.
 *
 *  @remarks
 *  **Lost-success / retry-after-persist-failed UX caveat.** When
 *  the failure originated from `provider.persist()` ignoring the
 *  registry's signal AND the underlying disk write later
 *  succeeded (PR #4255 fold-in 9 #7 — only reachable for
 *  non-conforming future providers; the Qwen provider honors
 *  signal end-to-end), the daemon emits
 *  `auth_device_flow_failed`/`persist_failed` to SSE while the
 *  credentials are silently on disk. A naive SDK retry (\"disk
 *  transient, try again\") will hit the IdP a second time with
 *  a fresh `device_code`, prompting the user a second time —
 *  but the FIRST credential set is already valid. If the second
 *  prompt times out without approval, the user is logged in
 *  (from the first lost-success persist) without realizing they
 *  retried.
 *
 *  Mitigations for SDK consumers writing retry logic:
 *  - Call `client.auth.getStatus()` (`GET /workspace/auth/status`)
 *    before re-prompting on `persist_failed`. If the daemon
 *    reports an active credential for the provider, the previous
 *    persist committed and a retry would be redundant.
 *  - Operators can grep daemon stderr / audit log for
 *    `lost_success_after_timeout` to detect occurrences of the
 *    inconsistency window. */
 | 'persist_failed';
/**
 * Phantom-branded opaque container for material that must never escape the
 * registry boundary into HTTP responses, audit logs, or daemon events.
 *
 * **Why a frozen plain object, not `new String(value)`:** an earlier draft
 * used a `String` wrapper with `toJSON` / `toString` overrides. Empirical
 * test (and code-review pass): `"x=" + new String("foo")` evaluates to
 * `"x=foo"` because `+` coerces via `Symbol.toPrimitive` → `valueOf` (which
 * the `String` wrapper inherits and returns the raw primitive), NOT
 * `toString`. Template literals (`${secret}`) take the same path. So a
 * future commit that templated a `BrandedSecret<string>` into a log line
 * would silently leak the upstream device_code into stderr / journald.
 *
 * The current shape is a frozen plain object whose only string-coercion
 * paths (`toString`, `toJSON`, `Symbol.toPrimitive`) all return
 * `'[redacted]'`. The actual primitive is held in a module-level
 * `WeakMap`, retrievable only via `unsafeRevealSecret`. Brand uses a `unique
 * symbol` so other modules can't structurally satisfy it.
 *
 * Misuse paths and what they produce:
 *   `JSON.stringify({s: secret})` → `'{"s":"[redacted]"}'`
 *   `String(secret)`              → `'[redacted]'`
 *   `'x=' + secret`               → `'x=[redacted]'`
 *   `` `s=${secret}` ``           → `'s=[redacted]'`
 *   `secret.length`               → undefined (no String prototype)
 *   `+secret`                     → NaN
 *   `unsafeRevealSecret(secret)`        → the original primitive (only path)
 */
declare const SECRET_BRAND: unique symbol;
export interface BrandedSecret<T extends string = string> {
    readonly [SECRET_BRAND]: true;
    /** All four string-coercion hooks return `'[redacted]'` so accidental
     *  serialization / interpolation cannot leak the underlying primitive. */
    toString(): '[redacted]';
    toJSON(): '[redacted]';
    [Symbol.toPrimitive](): '[redacted]';
    /** Phantom marker preserving the literal type at the type level so
     *  `BrandedSecret<'qwen-oauth'>` is distinguishable from
     *  `BrandedSecret<string>` when a caller wants a narrower brand. */
    readonly _phantom?: T;
}
export declare function brandSecret<T extends string>(value: T): BrandedSecret<T>;
/**
 * Reveal a branded secret. Callers must NOT pass the result back to event
 * emitters, response bodies, or stderr without explicit redaction. The
 * `unsafe`-prefixed name is intentional: greppable in code review, easy
 * to allowlist in lint rules (`no-restricted-imports` /
 * `no-restricted-syntax` keying off the identifier), and hard to
 * invoke by accident or muscle memory. PR #4255 fold-in 5 review
 * thread #2: renamed from `revealSecret` so the JSDoc-promised
 * "greppable" property is actually the case in the codebase.
 */
export declare function unsafeRevealSecret<T extends string>(secret: BrandedSecret<T>): T;
export interface DeviceFlowStartResult {
    deviceCode: BrandedSecret<string>;
    userCode: string;
    verificationUri: string;
    verificationUriComplete?: string;
    /** RFC 8628 §3.2 `expires_in` (seconds). */
    expiresIn: number;
    /** Initial polling interval in seconds. RFC 8628 default = 5. */
    interval?: number;
    pkceVerifier?: BrandedSecret<string>;
}
export type DeviceFlowPollResult = {
    kind: 'pending';
} | {
    kind: 'slow_down';
} | {
    kind: 'success';
    /** The provider persists credentials and returns metadata for the
     *  `auth_device_flow_authorized` event. The registry passes its
     *  per-entry `cancelController.signal` so a slow disk I/O
     *  (NFS, encrypted volumes) honors `cancel()` / `dispose()`.
     *
     *  PR #4255 review (post-fold-in-2 redirection): the earlier
     *  `unpersist()` companion was removed. When `persist()` succeeds
     *  AND a cancel/dispose transitioned the entry mid-await, the
     *  registry now FORCES the entry to `authorized` and keeps the
     *  on-disk credentials. Rationale: the user already approved on
     *  the IdP page (RFC 8628 device_code is single-use), so the
     *  microsecond cancel race shouldn't waste their approval. The
     *  audit trail records the race for incident response.
     *
     *  @remarks
     *  **Provider-author contract — `signal` MUST be honored.** The
     *  registry races this promise against `DEVICE_FLOW_PERSIST_TIMEOUT_MS`
     *  (currently 30 s). When the timeout fires, the registry
     *  publishes `persist_failed` to SSE subscribers AND aborts
     *  `signal`. A non-cooperative provider that ignores `signal`
     *  and later commits credentials anyway leaves the daemon in a
     *  split-brain state: every SDK consumer sees `persist_failed`
     *  via SSE while the credentials are silently on disk. The
     *  registry detects this and emits a
     *  `lost_success_after_timeout` audit breadcrumb (PR #4255
     *  fold-in 9 #7), but it cannot rescue the SDK consumers'
     *  view. The contract is therefore: every fs / network call
     *  inside `persist` MUST take `signal` as input AND propagate
     *  it down to abortable primitives (`fs.writeFile`, `fetch`,
     *  etc.). `cacheQwenCredentials({signal})` in
     *  `qwenDeviceFlowProvider` is the canonical example. */
    persist(opts: {
        signal: AbortSignal;
    }): Promise<{
        expiresAt?: number;
        accountAlias?: string;
    }>;
} | {
    kind: 'error';
    errorKind: DeviceFlowErrorKind;
    hint?: string;
};
export interface DeviceFlowProvider {
    readonly providerId: DeviceFlowProviderId;
    /**
     * Begin a device-authorization grant against the IdP. Same SSE-leak
     * sanitization rule as `poll()` applies to thrown error messages —
     * see `poll()` `@remarks` below.
     */
    start(opts: {
        signal: AbortSignal;
    }): Promise<DeviceFlowStartResult>;
    /**
     * Poll the upstream IdP for the user's authorization decision. The
     * `signal` lets the registry abort an in-flight poll on `cancel()`
     * or `dispose()` so the daemon doesn't keep consuming `device_code`
     * quota after it's logically given up. Providers that pass `signal`
     * to their `fetch` get cleanest tear-down; those that ignore it
     * still see the post-`await` guard suppress the resolved frame.
     *
     * @remarks
     * **Provider-author contract — sanitize before throwing.** The
     * registry's `runPollTick` catch block forwards `err.message`
     * verbatim into the `auth_device_flow_failed` event's `hint`
     * field, which is workspace-broadcast over SSE to every subscriber
     * (and durably stored in the registry's terminal entry). A naive
     * provider that re-throws a `fetch` failure or upstream payload
     * untouched will leak: (a) full IdP response bodies (HTML error
     * pages from a reverse proxy / WAF can run into hundreds of
     * kilobytes), (b) infrastructure detail (internal hostnames, proxy
     * banners), (c) ANY embedded secret material the upstream
     * accidentally echoed.
     *
     * Two equally-correct paths for new providers:
     *   1. **Resolve to a typed `error` result** — return
     *      `{ kind: 'error', errorKind, hint }` with a *bounded
     *      static-or-pattern hint*. This is the preferred path; it
     *      keeps full structured-error fidelity and drops nothing.
     *   2. **Throw, but only with a sanitized `Error.message`** — if
     *      the implementation finds it more natural to throw,
     *      construct the thrown `Error` with a *short bounded sentence
     *      that contains no IdP body / banner / secret*. Send the raw
     *      detail through `writeStderrLine` for operator audit; the
     *      thrown `message` is the SSE-visible surface.
     *
     * `qwenDeviceFlowProvider` is the canonical example — see PR #4255
     * review S2 + fold-in 3 #9 + fold-in 5 #4 for the historical
     * regressions this contract prevents.
     */
    poll(state: {
        deviceCode: BrandedSecret<string>;
        pkceVerifier?: BrandedSecret<string>;
    }, opts: {
        signal: AbortSignal;
    }): Promise<DeviceFlowPollResult>;
}
/** Public, redacted view of a flow returned by GET /workspace/auth/device-flow/:id. */
export interface DeviceFlowPublicView {
    deviceFlowId: string;
    providerId: DeviceFlowProviderId;
    status: DeviceFlowStatus;
    errorKind?: DeviceFlowErrorKind;
    hint?: string;
    /** Pending only: redisplayed on reconnect so the SDK can re-render the
     *  user_code prompt without persisting it client-side. Terminal entries
     *  drop these. */
    userCode?: string;
    verificationUri?: string;
    verificationUriComplete?: string;
    expiresAt?: number;
    intervalMs?: number;
    lastPolledAt?: number;
    createdAt: number;
    initiatorClientId?: string;
}
/** Outbound event-payload shapes (mirrors SDK `DaemonAuth*` data types). */
export type DeviceFlowEventEmission = {
    type: 'started';
    data: {
        deviceFlowId: string;
        providerId: DeviceFlowProviderId;
        expiresAt: number;
    };
} | {
    type: 'throttled';
    data: {
        deviceFlowId: string;
        intervalMs: number;
    };
} | {
    type: 'authorized';
    data: {
        deviceFlowId: string;
        providerId: DeviceFlowProviderId;
        expiresAt?: number;
        accountAlias?: string;
    };
} | {
    type: 'failed';
    data: {
        deviceFlowId: string;
        errorKind: DeviceFlowErrorKind;
        hint?: string;
    };
} | {
    type: 'cancelled';
    data: {
        deviceFlowId: string;
    };
};
export interface DeviceFlowEventSink {
    /** Best-effort fan-out. The sink swallows its own internal errors so a
     *  misbehaving subscriber can't poison the registry's state machine. */
    publish(emission: DeviceFlowEventEmission, originatorClientId?: string): void;
}
export interface DeviceFlowAuditSink {
    /** Structured stderr audit breadcrumb. `mutate({strict:true})` doesn't
     *  carry an audit hook; PR 21 §8 #9 mandates a parallel log channel. */
    record(line: {
        deviceFlowId: string;
        providerId: DeviceFlowProviderId;
        clientId?: string;
        status: 'started' | 'authorized' | 'failed' | 'cancelled' | 'expired';
        errorKind?: DeviceFlowErrorKind;
        expiresInMs?: number;
        /** Free-form audit detail. Used by the C4 lost-success rollback
         *  path to capture rollback failures without polluting the
         *  user-facing event hint. */
        hint?: string;
    }): void;
}
export interface DeviceFlowRegistryDeps {
    events: DeviceFlowEventSink;
    audit?: DeviceFlowAuditSink;
    /** Provider lookup. Tests stub a fake provider; production wires the
     *  Qwen-OAuth implementation. */
    resolveProvider(providerId: DeviceFlowProviderId): DeviceFlowProvider | undefined;
    /** Inject a clock for deterministic tests. Defaults to `Date.now`. */
    now?: () => number;
    /** Inject a scheduler. Defaults to `setTimeout`. */
    schedule?: (ms: number, cb: () => void) => ReturnType<typeof setTimeout>;
    /** Inject a sweeper interval. Defaults to `setInterval`. */
    scheduleInterval?: (ms: number, cb: () => void) => ReturnType<typeof setInterval>;
    clearScheduled?: (handle: ReturnType<typeof setTimeout>) => void;
    clearScheduledInterval?: (handle: ReturnType<typeof setInterval>) => void;
}
export interface DeviceFlowStartParams {
    providerId: DeviceFlowProviderId;
    initiatorClientId?: string;
}
/**
 * Thrown when `DeviceFlowRegistry.start()` cannot resolve a
 * `DeviceFlowProvider` for the supplied `providerId`.
 *
 * **Reachability:** the route layer (`server.ts`) already screens
 * unknown ids against `DEVICE_FLOW_SUPPORTED_PROVIDERS` and returns
 * `400 invalid_request` BEFORE reaching the registry — so this error
 * is reachable only on a daemon-internal invariant violation:
 * `DEVICE_FLOW_SUPPORTED_PROVIDERS` declares an id but the runtime
 * `resolveProvider` map doesn't carry an implementation for it
 * (e.g. forgot to register a provider for a newly-added id, or a
 * test harness omitted it). The `code` field stays
 * `'unsupported_provider'` for backward-compat with any test that
 * may have asserted on it; the route layer maps to `400` for
 * symmetry with the user-input path even though this branch
 * indicates a programmer error rather than user error. PR #4255
 * fold-in 4 review thread E.
 */
export declare class UnsupportedDeviceFlowProviderError extends Error {
    readonly code = "unsupported_provider";
    constructor(providerId: string);
}
export declare class TooManyActiveDeviceFlowsError extends Error {
    readonly code = "too_many_active_flows";
    constructor();
}
export declare class UpstreamDeviceFlowError extends Error {
    readonly code = "upstream_error";
    constructor(message: string);
}
/**
 * Sentinel error raised by `runPollTick`'s own `Promise.race` timer when
 * `provider.poll()` exceeds `DEVICE_FLOW_POLL_TIMEOUT_MS`. PR #4291
 * follow-up review (qwen-latest): the catch block previously routed
 * this through the same `provider.poll() threw (raw): ...` audit path
 * as a real provider throw, mis-leading on-call into investigating
 * provider code when the actual issue is a hung IdP / network
 * partition. The sentinel lets the catch differentiate the two and
 * emit a timeout-specific audit + hint.
 */
export declare class DeviceFlowPollTimeoutError extends Error {
    readonly code = "poll_timeout";
    readonly timeoutMs: number;
    constructor(timeoutMs: number);
}
export declare function setDeviceFlowRegistry(app: {
    locals: Record<string, unknown>;
}, registry: DeviceFlowRegistry): void;
export declare function getDeviceFlowRegistry(app: {
    locals: Record<string, unknown>;
}): DeviceFlowRegistry | undefined;
/**
 * In-memory device-flow state holder. Single instance per daemon.
 *
 * Lifecycle: `runQwenServe` constructs one, hands it to `createServeApp`,
 * and calls `dispose()` during shutdown drain so every pending poll timer
 * is cancelled before the process exits.
 */
export declare class DeviceFlowRegistry {
    private readonly deps;
    private readonly byId;
    private readonly byProvider;
    /**
     * Coalesces concurrent `start()` calls for the same `providerId`. Two
     * SDK clients posting `POST /workspace/auth/device-flow` in parallel
     * would otherwise both pass the "no existing pending entry" check,
     * each call `provider.start()` (a real IdP round-trip), and one's
     * write to `byProvider` would clobber the other — leaving an orphan
     * `byId` entry with a still-running poll timer that consumes IdP
     * quota for nothing. Mirrors `SharedTokenManager`'s in-flight refresh
     * coalescing pattern.
     */
    private readonly inFlightStarts;
    private sweeperHandle?;
    private disposed;
    private readonly now;
    private readonly schedule;
    private readonly scheduleInterval;
    private readonly clearScheduled;
    private readonly clearScheduledInterval;
    constructor(deps: DeviceFlowRegistryDeps);
    /**
     * Start a new device flow OR — under per-provider singleton semantics —
     * return the existing pending entry (`attached: true`). The take-over
     * branch deliberately does NOT re-call `provider.start()`; making the
     * second POST a no-op (rather than a fresh IdP request) is the property
     * that lets a reconnecting SDK pick up an in-flight login without
     * burning IdP quota.
     */
    start(params: DeviceFlowStartParams): Promise<{
        view: DeviceFlowPublicView;
        attached: boolean;
    }>;
    private doStart;
    get(deviceFlowId: string): DeviceFlowPublicView | undefined;
    /**
     * Cancel a pending flow. Idempotent on terminal entries (returns
     * `{ alreadyTerminal: true }` and does NOT re-emit `cancelled` —
     * RFC 7231 §4.3.5: DELETE may still be a 204 even when nothing was
     * removed). Returns `undefined` for unknown ids so the route layer
     * can map it to 404.
     */
    cancel(deviceFlowId: string, cancellerClientId?: string): {
        alreadyTerminal: boolean;
    } | undefined;
    /**
     * Active = pending entries already installed in `byProvider` PLUS
     * in-flight starts that haven't yet completed `provider.start()`.
     * Terminal entries in grace don't count toward the cap.
     *
     * PR #4255 round-13 #1 (gpt-5.5 review C1gh0): including
     * `inFlightStarts.size` here closes a workspace-wide cap bypass.
     * Concurrent starts for `DEVICE_FLOW_MAX_CONCURRENT + 1` DISTINCT
     * providers all run to their first await synchronously: each
     * checks the cap before any has populated `byProvider`, and each
     * passes (count = 0). All `MAX+1` then `await provider.start()`,
     * eventually installing more than the documented four pending
     * flows. Adding `inFlightStarts.size` makes the accounting
     * include the not-yet-installed reservations — the second
     * concurrent caller sees `count = 1`, the third `count = 2`, and
     * so on. `byProvider` and `inFlightStarts` are disjoint by
     * construction (the existing-pending-entry fast-path catches any
     * provider with both), so simple addition cannot double-count.
     */
    private countActive;
    private schedulePoll;
    private runPollTick;
    /**
     * Record a take-over: a second SDK client posted
     * `POST /workspace/auth/device-flow` for a provider that already has
     * a pending entry (or one being created in `inFlightStarts`). When
     * the second caller's `initiatorClientId` differs from the entry's,
     * stamp it on `entry.lastOriginatorClientId` and emit an audit
     * breadcrumb. No event publish — the per-provider singleton's
     * `started` event was already broadcast workspace-wide, and emitting
     * a second `started` would confuse SDK reducers (the `attached:
     * true` HTTP response is the second caller's signal). PR #4255
     * fold-in 6 review thread #6.
     */
    private recordTakeover;
    /**
     * Drive a pending entry to the time-based `expired` terminal:
     * `transitionTerminal` + emit `failed`/`expired_token` event +
     * audit. PR #4255 fold-in 9 review thread #3: extracted from
     * the two identical sites (poll-tick top-of-loop + sweeper) so
     * the event shape lives in one place. No-op if the entry has
     * already transitioned (the transitionTerminal idempotence guard
     * handles the sweeper × poll-tick race).
     */
    private expireEntry;
    /**
     * Move a pending entry to terminal state. Returns **`true` exactly once**
     * — the call site that successfully drove the transition. Subsequent
     * calls (sweeper × poll-tick race, double cancel, etc.) return `false`
     * so the caller can suppress duplicate event publish + audit log.
     *
     * On a successful transition:
     *   1. clears any pending poll timer
     *   2. wipes the secret material from `entry.deviceCode` /
     *      `entry.pkceVerifier`. The PRIMARY guard against secret leaks
     *      is the `entry.status !== 'pending'` check at the top of
     *      `runPollTick` — a stale timer that managed to fire post-clear
     *      bails out before touching the entry. Secret-clearing here is
     *      DEFENSE IN DEPTH: even if a future refactor weakens the
     *      status guard, the registry's in-memory state can no longer
     *      hand out the upstream `device_code` to a late-arriving
     *      logger / serializer.
     *   3. records `terminalAt` for the sweeper to evict after grace
     *   4. removes the per-provider singleton index so a new POST creates
     *      a fresh flow instead of taking over the terminal one
     */
    private transitionTerminal;
    /**
     * Periodic sweeper:
     *   (a) pending entries past `expiresAt` get a synthetic timeout event
     *       (the polling loop also handles this on its next tick, but a
     *       wedged poll path should not block expiry)
     *   (b) terminal entries past their grace window get evicted entirely
     */
    private sweep;
    /**
     * For diagnostics / GET /workspace/auth/status: report only pending
     * flows. Terminal entries are an implementation detail of the SDK
     * reconnect path and shouldn't be enumerated to all bearer-token
     * holders.
     */
    listPending(): DeviceFlowPublicView[];
    dispose(): void;
}
export {};
