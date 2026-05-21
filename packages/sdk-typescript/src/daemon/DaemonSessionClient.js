/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {} from './DaemonClient.js';
/**
 * Session-scoped wrapper around `DaemonClient`.
 *
 * `DaemonClient` mirrors the raw HTTP API and requires a `sessionId` on each
 * method. `DaemonSessionClient` is the adapter-facing layer for TUI, channel,
 * IDE, and web backends: it binds one daemon session, forwards the existing
 * Stage 1 routes, and preserves SSE replay state. It intentionally does not
 * interpret daemon event payloads; typed event reducers belong to the protocol
 * schema layer — see `asKnownDaemonEvent` and `reduceDaemonSessionEvent` in
 * `./events.js` for the typed consumption surface.
 */
export class DaemonSessionClient {
    client;
    session;
    state;
    lastSeenEventId;
    subscriptionActive = false;
    constructor(opts) {
        this.client = opts.client;
        this.session = { ...opts.session };
        this.state = { ...(opts.state ?? {}) };
        this.lastSeenEventId = validateLastEventId(opts.lastEventId);
    }
    /**
     * Creates a new daemon session or attaches to an existing matching session.
     */
    static async createOrAttach(client, req = {}, clientId) {
        const session = await client.createOrAttachSession(req, clientId);
        // Seed the first subscription from the daemon replay ring whenever
        // events can fire during the session-creation window — otherwise
        // they land in the per-session ring before the consumer's first
        // `events()` call and never reach the live stream.
        //
        // Two such windows exist today:
        // - **Newly-created sessions** (`session.attached === false`): the
        //   child's `newSession` handler runs MCP discovery synchronously
        //   in legacy blocking mode and as background work in progressive
        //   mode. PR 14b's `mcp_budget_warning` / `mcp_child_refused_batch`
        //   push events fire during this window and are buffered on
        //   `BridgeClient.earlyEvents` until `byId.set` runs, then drained
        //   into the per-session bus before `spawnOrAttach` returns. The
        //   guardrail events advertised via `mcp_guardrail_events` are
        //   useless without this seed because they predate any live
        //   subscription.
        // - **Pre-PR 14b carve-out**: `modelServiceId` switch failures are
        //   reported on SSE, not the create/attach HTTP response. The
        //   original carve-out covered just this case; the unified rule
        //   below subsumes it (newly-created sessions always seed) while
        //   preserving the semantics for re-attached sessions where the
        //   caller may have an existing event cursor it doesn't want to
        //   reset.
        //
        // The daemon treats Last-Event-ID: 0 as "replay from the beginning
        // of the bounded ring"; if older events have already been evicted,
        // clients receive the retained suffix and continue live from there.
        const lastEventId = !session.attached || req.modelServiceId ? 0 : undefined;
        return new DaemonSessionClient({ client, session, lastEventId });
    }
    /**
     * Loads an existing daemon session and seeds the first event subscription
     * from the start of the daemon replay ring so history replay frames emitted
     * during `session/load` are visible to this client.
     */
    static async load(client, sessionId, req = {}, clientId) {
        const { state, ...session } = await client.loadSession(sessionId, req, clientId);
        return new DaemonSessionClient({
            client,
            session,
            state,
            lastEventId: 0,
        });
    }
    /**
     * Resumes an existing daemon session without requesting history replay.
     * Seeds the first event subscription from the start of the daemon
     * replay ring (`lastEventId: 0`) symmetric with `load()` — the agent's
     * `unstable_resumeSession` schedules an `available_commands_update`
     * via `setTimeout(0)`, which can publish to the daemon bus between
     * the HTTP response and the consumer's first `events()` call. Seeding
     * ensures that frame is observed instead of dropped.
     */
    static async resume(client, sessionId, req = {}, clientId) {
        const { state, ...session } = await client.resumeSession(sessionId, req, clientId);
        return new DaemonSessionClient({
            client,
            session,
            state,
            lastEventId: 0,
        });
    }
    get sessionId() {
        return this.session.sessionId;
    }
    get workspaceCwd() {
        return this.session.workspaceCwd;
    }
    get attached() {
        return this.session.attached;
    }
    get clientId() {
        return this.session.clientId;
    }
    get lastEventId() {
        return this.lastSeenEventId;
    }
    setLastEventId(lastEventId) {
        this.lastSeenEventId = validateLastEventId(lastEventId);
    }
    async prompt(req, signal) {
        return await this.client.prompt(this.sessionId, req, signal, this.clientId);
    }
    async cancel() {
        await this.client.cancel(this.sessionId, this.clientId);
    }
    /**
     * Bump the daemon's last-seen bookkeeping for this session. Adapters
     * with a long-lived view of a session (TUI/IDE/web) can fire this on
     * an interval to keep diagnostics fresh and feed PR 24 revocation
     * policy. Forwards the bound `clientId` so identified clients update
     * their per-client timestamp instead of just the session-wide one.
     */
    async heartbeat() {
        return await this.client.heartbeat(this.sessionId, this.clientId);
    }
    async setModel(modelId) {
        return await this.client.setSessionModel(this.sessionId, modelId, this.clientId);
    }
    async context() {
        return await this.client.sessionContext(this.sessionId, this.clientId);
    }
    async supportedCommands() {
        return await this.client.sessionSupportedCommands(this.sessionId, this.clientId);
    }
    async respondToPermission(requestId, response) {
        return await this.client.respondToPermission(requestId, response, this.clientId);
    }
    async respondToSessionPermission(requestId, response) {
        return await this.client.respondToSessionPermission(this.sessionId, requestId, response, this.clientId);
    }
    async close() {
        return await this.client.closeSession(this.sessionId, this.clientId);
    }
    async updateMetadata(metadata) {
        return await this.client.updateSessionMetadata(this.sessionId, metadata, this.clientId);
    }
    events(opts = {}) {
        return this.openEventSubscription(opts);
    }
    /**
     * @deprecated Use {@link events} instead. Both methods are equivalent.
     */
    subscribeEvents(opts = {}) {
        return this.openEventSubscription(opts);
    }
    openEventSubscription(opts) {
        const requestedLastEventId = validateLastEventId(opts.lastEventId);
        let started = false;
        let released = false;
        const release = () => {
            if (released)
                return;
            released = true;
            this.subscriptionActive = false;
        };
        const acquire = () => {
            if (started)
                return;
            if (this.subscriptionActive) {
                throw new Error('Another event subscription is already active on this session. ' +
                    'Reuse the existing AsyncGenerator or create a separate DaemonSessionClient.');
            }
            this.subscriptionActive = true;
            started = true;
        };
        const iterator = this.iterateEvents({ ...opts, lastEventId: requestedLastEventId }, release);
        return {
            next: async (value) => {
                if (!released) {
                    acquire();
                }
                return await iterator.next(value);
            },
            return: async () => {
                try {
                    return await iterator.return(undefined);
                }
                finally {
                    release();
                }
            },
            throw: async (error) => {
                try {
                    return await iterator.throw(error);
                }
                finally {
                    release();
                }
            },
            [Symbol.asyncIterator]() {
                return this;
            },
        };
    }
    async *iterateEvents(opts, release) {
        try {
            const { resume = true, ...subscribeOpts } = opts;
            const lastEventId = subscribeOpts.lastEventId ??
                (resume ? this.lastSeenEventId : undefined);
            for await (const event of this.client.subscribeEvents(this.sessionId, {
                ...subscribeOpts,
                lastEventId,
            })) {
                yield event;
                // Cursor updates happen after the consumer resumes iteration. That
                // avoids acknowledging an event before the adapter has processed it,
                // but means `lastEventId` intentionally lags while the handler for the
                // just-yielded event is still running.
                // The cursor is a replay watermark, so it only moves forward even if a
                // replayed or synthetic frame arrives with an older id.
                if (event.id !== undefined) {
                    this.lastSeenEventId = Math.max(this.lastSeenEventId ?? 0, validateLastEventId(event.id));
                }
            }
        }
        finally {
            release();
        }
    }
}
function validateLastEventId(lastEventId) {
    if (lastEventId === undefined)
        return undefined;
    if (!Number.isInteger(lastEventId) || lastEventId < 0) {
        throw new TypeError('lastEventId must be a finite non-negative integer');
    }
    return lastEventId;
}
//# sourceMappingURL=DaemonSessionClient.js.map