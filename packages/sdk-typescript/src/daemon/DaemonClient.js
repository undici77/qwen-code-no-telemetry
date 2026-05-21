/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DaemonAuthFlow } from './DaemonAuthFlow.js';
import { parseSseStream } from './sse.js';
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const CLIENT_ID_HEADER = 'X-Qwen-Client-Id';
/**
 * Strip any trailing slashes from a base URL via plain string ops. The
 * obvious `replace(/\/+$/, '')` is technically linear here (the regex is
 * end-anchored), but CodeQL's ReDoS detector flags any `\/+$` pattern as a
 * polynomial-regex risk on attacker-controlled input. Hand-rolling the loop
 * sidesteps the rule entirely.
 */
function stripTrailingSlashes(url) {
    let end = url.length;
    while (end > 0 && url.charCodeAt(end - 1) === 0x2f /* '/' */)
        end--;
    return end === url.length ? url : url.slice(0, end);
}
/**
 * Thrown for any non-2xx daemon response. `status` and `body` are surfaced
 * so callers can branch on the standard daemon HTTP semantics (404 missing
 * session, 401 bad token, 400 malformed body, 500 agent failure).
 */
export class DaemonHttpError extends Error {
    status;
    body;
    constructor(status, body, message) {
        super(message);
        this.name = 'DaemonHttpError';
        this.status = status;
        this.body = body;
    }
}
export class DaemonClient {
    baseUrl;
    token;
    _fetch;
    fetchTimeoutMs;
    // Lazy singleton so clients that never touch auth pay no allocation cost.
    // Exposed via the readonly `auth` accessor below.
    _authFlow;
    /**
     * High-level auth helper (issue #4175 PR 21). Wraps the four
     * `*DeviceFlow*` methods with a `start(...).awaitCompletion()` shape
     * for the common "log in remotely" UX. Lazy-constructed.
     */
    get auth() {
        if (!this._authFlow) {
            this._authFlow = new DaemonAuthFlow(this);
        }
        return this._authFlow;
    }
    constructor(opts) {
        this.baseUrl = stripTrailingSlashes(opts.baseUrl);
        this.token = opts.token;
        this._fetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
        // Coerce non-positive / non-finite to 0 (= disabled). Without this
        // a caller passing `-1` or `NaN` would slip past the
        // `Number.isFinite` check inside `fetchWithTimeout` (NaN fails
        // isFinite, negatives pass) and either short-circuit timeout entirely
        // or fire `setTimeout(-1)` → immediate abort, killing every request
        // before it could complete. The `0` sentinel is the documented
        // disable value, so we collapse all "doesn't make sense" inputs onto
        // it instead of defending the math at every call site.
        const raw = opts.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
        this.fetchTimeoutMs = Number.isFinite(raw) && raw > 0 ? raw : 0;
    }
    /**
     * Wrap a fetch call with the per-client `fetchTimeoutMs`. If the caller
     * passes their own `signal`, both signals abort the request via
     * `AbortSignal.any`, so caller cancellation and the per-call timeout
     * compose. Streaming endpoints (subscribeEvents) call `_fetch` directly
     * to skip the timeout — long-lived SSE connections must not be killed
     * by it.
     */
    async fetchWithTimeout(url, init = {}, consume) {
        // BRN1o: when `consume` is provided, the timer must remain
        // armed through the entire callback (body read + parse). The
        // previous `Response`-returning shape cleared the timer the
        // moment headers arrived, so `await res.json()` against a
        // proxy that stalled mid-body could hang indefinitely past
        // `fetchTimeoutMs`. Pass the body-reading code as a callback
        // so its execution is included in the timer scope; the
        // composed abort signal still flows through to fetch's body
        // stream, so an in-progress `res.json()` rejects cleanly when
        // the timer fires.
        if (!this.fetchTimeoutMs || !Number.isFinite(this.fetchTimeoutMs)) {
            const res = await this._fetch(url, init);
            if (consume)
                return consume(res);
            return res;
        }
        // Use AbortController + cancellable setTimeout instead of
        // `AbortSignal.timeout()` (the polyfill `abortTimeout` is the
        // same shape — fires once, never disarms). On a fast-resolving
        // request with a long `fetchTimeoutMs` (e.g. 30s default), the
        // pending timer keeps the event loop registration alive even
        // after the fetch already returned. High request volume × long
        // timeout = accumulating timers + retained closures. Clearing
        // in `finally` releases each timer the moment its fetch (and
        // body consume callback, if any) settles.
        const ctrl = new AbortController();
        const timer = setTimeout(() => {
            ctrl.abort(new DOMException('The operation timed out', 'TimeoutError'));
        }, this.fetchTimeoutMs);
        if (typeof timer === 'object' && timer && 'unref' in timer) {
            timer.unref();
        }
        const callerSignal = init.signal ?? undefined;
        const signal = callerSignal
            ? composeAbortSignals([callerSignal, ctrl.signal])
            : ctrl.signal;
        try {
            const res = await this._fetch(url, { ...init, signal });
            if (consume)
                return await consume(res);
            return res;
        }
        finally {
            clearTimeout(timer);
        }
    }
    // -- Plumbing -----------------------------------------------------------
    headers(extra = {}, clientId) {
        const out = { ...extra };
        if (this.token)
            out['Authorization'] = `Bearer ${this.token}`;
        if (clientId)
            out[CLIENT_ID_HEADER] = clientId;
        return out;
    }
    async failOnError(res, label) {
        // Read the body exactly once. `res.json()` consumes the stream even on
        // parse-failure, leaving a subsequent `res.text()` empty — so go via
        // text() and attempt JSON parsing ourselves; raw text is a useful
        // fallback (the daemon may surface text/plain on upstream errors).
        let body = undefined;
        try {
            const text = await res.text();
            if (text.length > 0) {
                try {
                    body = JSON.parse(text);
                }
                catch {
                    body = text;
                }
            }
        }
        catch {
            /* body unreadable */
        }
        const detail = body && typeof body === 'object' && 'error' in body
            ? String(body.error)
            : `HTTP ${res.status}`;
        return new DaemonHttpError(res.status, body, `${label}: ${detail}`);
    }
    // -- Lifecycle / discovery ---------------------------------------------
    async health() {
        return await this.fetchWithTimeout(`${this.baseUrl}/health`, { headers: this.headers() }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'GET /health');
            return (await res.json());
        });
    }
    async capabilities() {
        return await this.fetchWithTimeout(`${this.baseUrl}/capabilities`, { headers: this.headers() }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'GET /capabilities');
            return (await res.json());
        });
    }
    async workspaceMcp() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/mcp`, { headers: this.headers() }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'GET /workspace/mcp');
            return (await res.json());
        });
    }
    async workspaceSkills() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/skills`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/skills');
            }
            return (await res.json());
        });
    }
    async workspaceProviders() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/providers`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/providers');
            }
            return (await res.json());
        });
    }
    // -- Workspace files (issue #4175 PR 20) -------------------------------
    async readWorkspaceFile(filePath, opts = {}, clientId) {
        const url = new URL(`${this.baseUrl}/file`);
        url.searchParams.set('path', filePath);
        if (opts.maxBytes !== undefined) {
            url.searchParams.set('maxBytes', String(opts.maxBytes));
        }
        if (opts.line !== undefined) {
            url.searchParams.set('line', String(opts.line));
        }
        if (opts.limit !== undefined) {
            url.searchParams.set('limit', String(opts.limit));
        }
        return await this.fetchWithTimeout(url.toString(), { headers: this.headers({}, clientId) }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'GET /file');
            return (await res.json());
        });
    }
    async readWorkspaceFileBytes(filePath, opts = {}, clientId) {
        const url = new URL(`${this.baseUrl}/file/bytes`);
        url.searchParams.set('path', filePath);
        if (opts.offset !== undefined) {
            url.searchParams.set('offset', String(opts.offset));
        }
        if (opts.maxBytes !== undefined) {
            url.searchParams.set('maxBytes', String(opts.maxBytes));
        }
        return await this.fetchWithTimeout(url.toString(), { headers: this.headers({}, clientId) }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'GET /file/bytes');
            return (await res.json());
        });
    }
    async writeWorkspaceFile(req, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/file/write`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(req),
        }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'POST /file/write');
            return (await res.json());
        });
    }
    async editWorkspaceFile(req, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/file/edit`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(req),
        }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'POST /file/edit');
            return (await res.json());
        });
    }
    // -- Workspace memory (issue #4175 PR 16) ------------------------------
    /**
     * Fetch the daemon's `QWEN.md` / `AGENTS.md` snapshot. Read-only;
     * pre-flight `caps.features.workspace_memory` before calling
     * against an unknown daemon. Returns `initialized: false` and an
     * empty `files` array when no memory files exist at the bound
     * workspace root or `~/.qwen`.
     *
     * v1 discovers files at the bound workspace ROOT only, plus the
     * user's global `~/.qwen` directory — it does NOT walk parent
     * directories or recurse into the workspace tree. The route's
     * companion helper `walkWorkspaceForMemory` keeps a guarded
     * upward-walk loop body for a future hierarchical mode but breaks
     * after iteration 1 in this release. PR 16.5 will lift the cap
     * once auto-memory CRUD lands.
     */
    async workspaceMemory() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/memory`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/memory');
            }
            return (await res.json());
        });
    }
    /**
     * Append to or replace `QWEN.md` at workspace or global scope.
     * Strict mutation gate (`token_required` on no-token loopback
     * defaults). When the daemon advertises `workspace_memory`, expect
     * 200 with `{ ok, filePath, bytesWritten, mode }`; older daemons
     * without the capability return 404.
     */
    async writeWorkspaceMemory(req, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/memory`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(req),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /workspace/memory');
            }
            return (await res.json());
        });
    }
    // -- Workspace agents (issue #4175 PR 16) ------------------------------
    async listWorkspaceAgents() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/agents`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/agents');
            }
            return (await res.json());
        });
    }
    /**
     * Create a project- or user-level subagent. 409 `agent_already_exists`
     * when a same-name agent is already registered at the chosen level;
     * 422 `invalid_config` for validation failures.
     */
    async createWorkspaceAgent(req, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/agents`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(req),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /workspace/agents');
            }
            return (await res.json());
        });
    }
    async getWorkspaceAgent(agentType) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/agents/${encodeURIComponent(agentType)}`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/agents/:agentType');
            }
            return (await res.json());
        });
    }
    /**
     * Update a project- or user-level subagent definition. Built-in /
     * extension / session-level agents are read-only and return 403
     * `agent_readonly`; missing agents return 404 `agent_not_found`.
     *
     * Optional `scope` mirrors the delete helper: when a project agent
     * shadows a user-level agent of the same name, pass
     * `{ scope: 'global' }` to update the user-level definition
     * specifically. Without the scope the daemon resolves through the
     * default precedence (project > user) and updates the project entry.
     */
    async updateWorkspaceAgent(agentType, req, opts = {}, clientId) {
        const url = opts.scope
            ? `${this.baseUrl}/workspace/agents/${encodeURIComponent(agentType)}?scope=${encodeURIComponent(opts.scope)}`
            : `${this.baseUrl}/workspace/agents/${encodeURIComponent(agentType)}`;
        return await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(req),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /workspace/agents/:agentType');
            }
            return (await res.json());
        });
    }
    /**
     * Delete a project- or user-level subagent definition. Optional
     * `scope` query narrows deletion to one level when the same name
     * exists at both. Idempotent for SDK callers — both 204 (deleted)
     * and 404 (already gone) resolve successfully.
     */
    async deleteWorkspaceAgent(agentType, opts = {}, clientId) {
        const url = opts.scope
            ? `${this.baseUrl}/workspace/agents/${encodeURIComponent(agentType)}?scope=${encodeURIComponent(opts.scope)}`
            : `${this.baseUrl}/workspace/agents/${encodeURIComponent(agentType)}`;
        return await this.fetchWithTimeout(url, {
            method: 'DELETE',
            headers: this.headers({}, clientId),
        }, async (res) => {
            if (res.status === 204) {
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return;
            }
            // Treat as idempotent ONLY when the daemon explicitly says
            // `agent_not_found`. A bare 404 (e.g. an HTTP proxy returning
            // a generic page, an older daemon that doesn't know the
            // route, a misrouted load balancer) would otherwise be
            // silently swallowed and the SDK caller would believe the
            // agent was deleted when the request never reached a route
            // that understands workspace agents. Failing on non-
            // structured 404s makes routing errors visible.
            if (res.status === 404) {
                const err = await this.failOnError(res, 'DELETE /workspace/agents/:agentType');
                const body = err.body;
                if (body && body.code === 'agent_not_found')
                    return;
                throw err;
            }
            throw await this.failOnError(res, 'DELETE /workspace/agents/:agentType');
        });
    }
    async workspaceEnv() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/env`, { headers: this.headers() }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'GET /workspace/env');
            return (await res.json());
        });
    }
    async workspacePreflight() {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/preflight`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/preflight');
            }
            return (await res.json());
        });
    }
    // -- Sessions ----------------------------------------------------------
    async createOrAttachSession(req, clientId) {
        // Per #3803 §02: omitting `cwd` lets the daemon fall back to its
        // bound workspace. JSON.stringify strips `undefined` values, so
        // `cwd: undefined` becomes "no `cwd` key" on the wire — and the
        // server then takes the documented fallback path.
        //
        // Send EVERY defined `workspaceCwd` value through as-is, including
        // the empty string. A truthy guard would silently swallow
        // `workspaceCwd: ""` (a likely client-side bug) and let the server
        // fall back instead of returning a clear 400 for the malformed
        // input. The SDK should be a transparent layer here: passing the
        // caller's value verbatim lets the server's validation surface
        // bugs that would otherwise hide as "wrong workspace bound".
        return await this.fetchWithTimeout(`${this.baseUrl}/session`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify({
                cwd: req.workspaceCwd,
                ...(req.modelServiceId ? { modelServiceId: req.modelServiceId } : {}),
                // `!== undefined` (not truthy) so a buggy caller passing
                // `sessionScope: '' | null` doesn't get the field silently
                // erased on the wire — let the daemon's `400
                // invalid_session_scope` surface the bug. Same shape the
                // bridge's own validation uses (`httpAcpBridge.ts:
                // spawnOrAttach`); SDK should be a transparent layer here.
                ...(req.sessionScope !== undefined
                    ? { sessionScope: req.sessionScope }
                    : {}),
            }),
        }, async (res) => {
            if (!res.ok)
                throw await this.failOnError(res, 'POST /session');
            return (await res.json());
        });
    }
    /**
     * Enumerate live sessions in the given workspace. Used by session-picker
     * UIs. Returns an empty list (not 404) when the workspace has no sessions.
     */
    async listWorkspaceSessions(workspaceCwd) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/${encodeURIComponent(workspaceCwd)}/sessions`, { headers: this.headers() }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/:id/sessions');
            }
            const body = (await res.json());
            return body.sessions;
        });
    }
    async loadSession(sessionId, req = {}, clientId) {
        return this.restoreSession('load', sessionId, req, clientId);
    }
    async resumeSession(sessionId, req = {}, clientId) {
        return this.restoreSession('resume', sessionId, req, clientId);
    }
    async sessionContext(sessionId, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/context`, { headers: this.headers({}, clientId) }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /session/:id/context');
            }
            return (await res.json());
        });
    }
    async sessionSupportedCommands(sessionId, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/supported-commands`, { headers: this.headers({}, clientId) }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /session/:id/supported-commands');
            }
            return (await res.json());
        });
    }
    /**
     * Shared transport for `loadSession` / `resumeSession`. Both routes
     * share an identical wire shape (POST /session/:id/{load|resume}
     * with optional `cwd` body) and identical error envelopes from the
     * daemon, so they collapse into a single fetch path that only
     * differs in the URL suffix and the route name reported on errors.
     */
    async restoreSession(action, sessionId, req, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/${action}`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify({ cwd: req.workspaceCwd }),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, `POST /session/:id/${action}`);
            }
            return (await res.json());
        });
    }
    /**
     * #4175 Wave 4 PR 17. Change the approval mode of a live session.
     * The daemon applies the change in the ACP child's per-session
     * `Config` and publishes an `approval_mode_changed` event. Pass
     * `opts.persist: true` to also write `tools.approvalMode` to the
     * workspace settings file (default is ephemeral so a remote caller
     * does not pollute the user's host settings unless asked).
     *
     * Pre-flight `caps.features.session_approval_mode_control` before
     * calling — older daemons reject the route with 404.
     *
     * The trust-folder gate inside core's `setApprovalMode` rejects
     * privileged modes in untrusted folders; the route surfaces that
     * with HTTP 403 + `errorKind: 'auth_env_error'`.
     */
    async setSessionApprovalMode(sessionId, mode, opts) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/approval-mode`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, opts?.clientId),
            body: JSON.stringify({
                mode,
                ...(opts?.persist === true ? { persist: true } : {}),
            }),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /session/:id/approval-mode');
            }
            return (await res.json());
        });
    }
    /**
     * #4175 Wave 4 PR 17. Toggle a tool name in the workspace's
     * `tools.disabled` settings list. Strict-gated mutation route — the
     * daemon must be configured with a bearer token. The daemon writes
     * the settings file directly and fan-outs a `tool_toggled` event to
     * every live session SSE bus.
     *
     * Already-registered tools in active sessions are NOT retroactively
     * unregistered. The toggle takes effect on the next ACP child spawn
     * — listeners that need the live tool list to reflect the change
     * should also `POST /workspace/mcp/:server/restart` (when the tool
     * is MCP-discovered) or open a new session.
     *
     * Pre-flight `caps.features.workspace_tool_toggle` before calling.
     */
    async setWorkspaceToolEnabled(toolName, enabled, opts) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/tools/${encodeURIComponent(toolName)}/enable`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, opts?.clientId),
            body: JSON.stringify({ enabled }),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /workspace/tools/:name/enable');
            }
            return (await res.json());
        });
    }
    /**
     * #4175 Wave 4 PR 17. Restart a configured MCP server through the
     * ACP child's `McpClientManager`. The daemon pre-checks the live
     * budget snapshot from PR 14 v1; soft refusals (in-flight discovery,
     * disabled server, budget would exceed under `enforce` mode) come
     * back as 200 OK with `{restarted: false, skipped: true, reason}`.
     * Only hard errors (unknown server name, no live ACP channel)
     * surface as non-2xx.
     *
     * Pre-flight `caps.features.workspace_mcp_restart` before calling.
     */
    async restartMcpServer(serverName, opts) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/mcp/${encodeURIComponent(serverName)}/restart`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, opts?.clientId),
            body: '{}',
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /workspace/mcp/:server/restart');
            }
            return (await res.json());
        });
    }
    /**
     * #4175 Wave 4 PR 17. Scaffold a `QWEN.md` at the daemon's bound
     * workspace root. Mechanical only — does NOT invoke the LLM. The
     * daemon writes an empty file; clients that want AI-driven content
     * fill should follow up with `POST /session/:id/prompt`.
     *
     * Default refuses to overwrite — when the file exists with non-
     * whitespace content the daemon returns 409
     * `workspace_init_conflict` with the existing path and size in the
     * body. Pass `opts.force: true` to overwrite unconditionally.
     *
     * Pre-flight `caps.features.workspace_init` before calling.
     */
    async initWorkspace(opts) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/init`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, opts?.clientId),
            body: JSON.stringify(opts?.force === true ? { force: true } : {}),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /workspace/init');
            }
            return (await res.json());
        });
    }
    /**
     * Switch the active model for a session. Backed by ACP's currently-unstable
     * `unstable_setSessionModel`; the daemon also publishes a `model_switched`
     * event so cross-client UIs can update.
     */
    async setSessionModel(sessionId, modelId, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/model`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify({ modelId }),
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /session/:id/model');
            }
            return (await res.json());
        });
    }
    /**
     * Send a prompt to the agent. Long-lived: a model + tool turn can
     * take minutes, so this method bypasses `fetchTimeoutMs` (which
     * would force a default 30s deadline that's too short for normal
     * use). Cancellation is via the optional `signal` — when it fires,
     * the daemon receives the underlying TCP close and forwards an
     * ACP `cancel` notification to the agent, resolving the prompt
     * with `stopReason: 'cancelled'`. `cancel(sessionId)` is the
     * out-of-band alternative.
     */
    async prompt(sessionId, req, signal, clientId) {
        const res = await this._fetch(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/prompt`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(req),
            signal,
        });
        if (!res.ok)
            throw await this.failOnError(res, 'POST /session/:id/prompt');
        return (await res.json());
    }
    /**
     * Bump the daemon's last-seen bookkeeping for this session. The
     * route is short-lived — drives diagnostics and future revocation
     * policy (Wave 5 PR 24) — so it goes through the standard
     * `fetchTimeoutMs`. Older daemons (pre-PR 9) return 404 for
     * `/heartbeat`; clients should pre-flight
     * `caps.features.client_heartbeat` before calling.
     */
    async heartbeat(sessionId, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/heartbeat`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: '{}',
        }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'POST /session/:id/heartbeat');
            }
            return (await res.json());
        });
    }
    async cancel(sessionId, clientId) {
        await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/cancel`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: '{}',
        }, async (res) => {
            if (!res.ok && res.status !== 204) {
                throw await this.failOnError(res, 'POST /session/:id/cancel');
            }
            // Drain so undici doesn't keep the socket pinned waiting for
            // the consumer (matches the respondToPermission rationale).
            try {
                await res.body?.cancel();
            }
            catch {
                /* body already consumed or no body */
            }
        });
    }
    // -- Events stream -----------------------------------------------------
    async *subscribeEvents(sessionId, opts = {}) {
        const headers = this.headers({ Accept: 'text/event-stream' });
        if (opts.lastEventId !== undefined) {
            headers['Last-Event-ID'] = String(opts.lastEventId);
        }
        // Apply `fetchTimeoutMs` to the CONNECT phase only (request → headers
        // received). The SSE body itself must NOT be timed out — it's
        // long-lived by design — so once `_fetch` returns the timer is
        // cleared. Without this, an unresponsive daemon (TCP open but no
        // headers) blocks `subscribeEvents` indefinitely instead of
        // failing with the same 30s default the rest of the SDK uses.
        const connectCtrl = new AbortController();
        let connectTimer;
        if (this.fetchTimeoutMs && Number.isFinite(this.fetchTimeoutMs)) {
            connectTimer = setTimeout(() => connectCtrl.abort(new DOMException('Initial connect timed out', 'TimeoutError')), this.fetchTimeoutMs);
            if (typeof connectTimer === 'object' &&
                connectTimer &&
                'unref' in connectTimer) {
                connectTimer.unref();
            }
        }
        const fetchSignal = opts.signal
            ? composeAbortSignals([opts.signal, connectCtrl.signal])
            : connectCtrl.signal;
        // Build the SSE URL, optionally with `?maxQueued=N`. We don't
        // validate the value client-side — the daemon's
        // `parseMaxQueuedQuery` is the source of truth on the range
        // `[16, 2048]` and returns a structured `400 invalid_max_queued`
        // for anything outside, so duplicating the bounds here would
        // diverge if the daemon's range ever shifts.
        let url = `${this.baseUrl}/session/${encodeURIComponent(sessionId)}/events`;
        if (opts.maxQueued !== undefined) {
            url += `?maxQueued=${encodeURIComponent(String(opts.maxQueued))}`;
        }
        let res;
        try {
            res = await this._fetch(url, { headers, signal: fetchSignal });
        }
        finally {
            if (connectTimer !== undefined)
                clearTimeout(connectTimer);
        }
        if (!res.ok) {
            throw await this.failOnError(res, 'GET /session/:id/events');
        }
        // A 200 with the wrong content type usually means a misconfigured
        // proxy or middleware swallowed our SSE response and replaced it
        // with JSON/HTML. Without this check `parseSseStream` would
        // silently produce zero frames — a confusing "no events" symptom
        // that's easy to misdiagnose. Fail fast with the actual mime type.
        //
        // Cancel the body before throwing so undici doesn't keep the
        // underlying socket pinned waiting for the consumer. Same
        // reasoning as `respondToPermission` — long-running clients
        // hitting this path repeatedly would otherwise exhaust the
        // connection pool.
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.toLowerCase().includes('text/event-stream')) {
            try {
                await res.body?.cancel();
            }
            catch {
                /* body already consumed or no body */
            }
            throw new DaemonHttpError(res.status, ct, `GET /session/:id/events: expected content-type text/event-stream, got "${ct}"`);
        }
        if (!res.body) {
            throw new Error('SSE response has no body');
        }
        // Forward the abort signal so post-200 aborts stop the iteration.
        // Without this, callers who `controller.abort()` after the response
        // arrives keep receiving frames until the upstream closes.
        yield* parseSseStream(res.body, opts.signal);
    }
    // -- Permissions -------------------------------------------------------
    /**
     * Cast a permission vote. Returns true when the daemon accepted the vote,
     * false on 404 (request unknown or already resolved by another client —
     * the typical "lost the race" outcome under multi-client fan-out).
     */
    async respondToPermission(requestId, response, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/permission/${encodeURIComponent(requestId)}`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(response),
        }, async (res) => {
            if (res.status === 200) {
                // Drain the body so undici doesn't keep the underlying socket
                // pinned waiting for the consumer. On long-running clients with
                // frequent permission votes this would exhaust the connection
                // pool. Use `res.body?.cancel()` rather than `await res.json()`
                // because the daemon returns `{}` (no useful payload here) and
                // cancel is cheaper than a parse round-trip.
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return true;
            }
            if (res.status === 404) {
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return false;
            }
            throw await this.failOnError(res, 'POST /permission/:requestId');
        });
    }
    /**
     * Cast a permission vote against an explicit daemon session. New clients
     * should prefer this once `capabilities.features` includes
     * `session_permission_vote`; the legacy request-id-only route remains for
     * older daemons.
     */
    async respondToSessionPermission(sessionId, requestId, response, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/permission/${encodeURIComponent(requestId)}`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(response),
        }, async (res) => {
            if (res.status === 200) {
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return true;
            }
            if (res.status === 404) {
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return false;
            }
            throw await this.failOnError(res, 'POST /session/:id/permission/:requestId');
        });
    }
    // -- Session lifecycle ---------------------------------------------------
    /**
     * Close a daemon session. The daemon treats DELETE as idempotent for SDK
     * callers: both 204 (closed) and 404 (already gone) resolve successfully.
     */
    async closeSession(sessionId, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
            headers: this.headers({}, clientId),
        }, async (res) => {
            if (res.status === 204 || res.status === 404) {
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return;
            }
            throw await this.failOnError(res, 'DELETE /session/:id');
        });
    }
    // -- Auth device-flow (issue #4175 PR 21) -------------------------------
    /**
     * Start an OAuth device-flow login for the given provider. The daemon
     * polls the IdP in the background and emits typed `auth_device_flow_*`
     * SSE events; callers can also poll `getDeviceFlow(...)`.
     *
     * Per-provider singleton: a repeat call while a flow is already pending
     * for the same provider is an idempotent take-over and returns the
     * existing entry rather than starting a fresh IdP request. The
     * `attached` field on the result distinguishes the two cases.
     */
    async startDeviceFlow(opts) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/auth/device-flow`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }, opts.clientId),
            body: JSON.stringify({ providerId: opts.providerId }),
        }, async (res) => {
            if (res.status !== 200 && res.status !== 201) {
                throw await this.failOnError(res, 'POST /workspace/auth/device-flow');
            }
            return (await res.json());
        });
    }
    async getDeviceFlow(deviceFlowId, opts = {}) {
        // PR #4255 fold-in 7 review thread #6: forward `signal` into
        // `fetchWithTimeout`, which composes it with the per-request
        // `fetchTimeoutMs` controller. Without this, an `awaitCompletion`
        // caller that aborts mid-poll could not cancel the in-flight GET
        // — only the post-await guard would notice, but that runs only
        // after the body is already settled (or the daemon-side
        // `fetchTimeoutMs` fires, which can be 30s+).
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/auth/device-flow/${encodeURIComponent(deviceFlowId)}`, { headers: this.headers({}, opts.clientId), signal: opts.signal }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/auth/device-flow/:id');
            }
            return (await res.json());
        });
    }
    /**
     * Cancel a pending device-flow. Idempotent: terminal entries return
     * 204 (no-op); unknown ids return 404 — both resolve here, matching
     * the SDK's `closeSession` shape.
     */
    async cancelDeviceFlow(deviceFlowId, opts = {}) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/auth/device-flow/${encodeURIComponent(deviceFlowId)}`, {
            method: 'DELETE',
            headers: this.headers({}, opts.clientId),
        }, async (res) => {
            if (res.status === 204 || res.status === 404) {
                try {
                    await res.body?.cancel();
                }
                catch {
                    /* body already consumed or no body */
                }
                return;
            }
            throw await this.failOnError(res, 'DELETE /workspace/auth/device-flow/:id');
        });
    }
    /** Snapshot of persisted auth credentials + currently pending device-flows. */
    async getAuthStatus(opts = {}) {
        return await this.fetchWithTimeout(`${this.baseUrl}/workspace/auth/status`, { headers: this.headers({}, opts.clientId) }, async (res) => {
            if (!res.ok) {
                throw await this.failOnError(res, 'GET /workspace/auth/status');
            }
            return (await res.json());
        });
    }
    // -- Session metadata ----------------------------------------------------
    /**
     * Patch mutable session metadata and return the effective stored metadata
     * reported by the daemon.
     */
    async updateSessionMetadata(sessionId, metadata, clientId) {
        return await this.fetchWithTimeout(`${this.baseUrl}/session/${encodeURIComponent(sessionId)}/metadata`, {
            method: 'PATCH',
            headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
            body: JSON.stringify(metadata),
        }, async (res) => {
            if (res.status === 200) {
                const body = (await res.json());
                return typeof body.displayName === 'string'
                    ? { displayName: body.displayName }
                    : {};
            }
            throw await this.failOnError(res, 'PATCH /session/:id/metadata');
        });
    }
}
/**
 * `AbortSignal.timeout` is in every Node version this package supports
 * (`engines.node >=22.0.0` ships it natively). The feature-detect below
 * is defensive against non-Node runtimes — browsers / edge workers /
 * stripped-down V8 hosts that may consume the SDK and ship an
 * incomplete `AbortSignal` shape.
 */
// Exported solely for direct unit testing — production callers go
// through `fetchWithTimeout` above. The polyfill branch only fires on
// runtimes where `AbortSignal.timeout` isn't natively available
// (non-Node hosts), which can't easily be exercised from the public
// API surface in unit tests.
export function abortTimeout(ms) {
    const tFn = AbortSignal.timeout;
    if (typeof tFn === 'function')
        return tFn.call(AbortSignal, ms);
    const ctrl = new AbortController();
    // `.unref()` so a fast-resolving fetch doesn't keep the event loop
    // alive waiting for this timer to fire (the call is `await`-ed so
    // a long-lived event loop is the caller's problem, not ours).
    // Also clear the timer when the controller aborts via another path
    // (the composed callerSignal aborts first) so we don't accumulate
    // pending timers across many fast calls in the polyfill path.
    // Native `AbortSignal.timeout()` aborts with a DOMException whose
    // `name === 'TimeoutError'` (per WHATWG). Constructor signature is
    // `new DOMException(message, name)` — calling `new DOMException(
    // 'TimeoutError')` would set the *message* to "TimeoutError" and
    // leave `name` at its default ("Error"), so callers doing
    // `if (err.name === 'TimeoutError')` would see the polyfill
    // differently from the native runtime.
    const handle = setTimeout(() => ctrl.abort(new DOMException('The operation timed out', 'TimeoutError')), ms);
    if (typeof handle === 'object' && handle && 'unref' in handle) {
        handle.unref();
    }
    ctrl.signal.addEventListener('abort', () => clearTimeout(handle), { once: true });
    return ctrl.signal;
}
/**
 * `AbortSignal.any` is available natively in every Node version this
 * package supports (`engines.node >=22.0.0` ships it). The polyfill
 * branch below is defensive against non-Node runtimes (browsers /
 * edge workers / stripped-down V8 hosts) that may consume the SDK
 * and lack `AbortSignal.any` — without it those callers would throw
 * `TypeError: AbortSignal.any is not a function` on every
 * non-streaming method.
 *
 * The polyfill creates a fresh controller and forwards the first abort
 * from any input signal, including any that are already aborted at call
 * time. It does NOT support every native edge-case (cleanup of remaining
 * listeners after the first fire is best-effort), but for `fetch`-style
 * single-shot use the difference is invisible.
 */
// Exported solely for direct unit testing — see note on `abortTimeout`.
export function composeAbortSignals(signals) {
    const anyFn = AbortSignal.any;
    if (typeof anyFn === 'function')
        return anyFn.call(AbortSignal, signals);
    const ctrl = new AbortController();
    // Track per-input listener so we can detach them all on the FIRST
    // abort (whichever input fires). Without this, callers who reuse a
    // long-lived AbortSignal (e.g. a session-scope cancel signal that
    // never fires for the lifetime of the SDK client) accumulate one
    // listener per SDK call — slow leak that retains the closure +
    // controller of every prior call.
    const cleanups = [];
    const detachAll = () => {
        while (cleanups.length > 0) {
            const fn = cleanups.pop();
            try {
                fn?.();
            }
            catch {
                /* swallow */
            }
        }
    };
    for (const s of signals) {
        if (s.aborted) {
            ctrl.abort(s.reason);
            detachAll();
            return ctrl.signal;
        }
        const onAbort = () => {
            ctrl.abort(s.reason);
            detachAll();
        };
        s.addEventListener('abort', onAbort, { once: true });
        cleanups.push(() => s.removeEventListener('abort', onAbort));
    }
    // Also detach if our composed controller aborts via some other path
    // (e.g. its consumer aborted independently — defense-in-depth).
    ctrl.signal.addEventListener('abort', detachAll, { once: true });
    return ctrl.signal;
}
//# sourceMappingURL=DaemonClient.js.map