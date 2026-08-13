/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { MAX_CHILD_HEAP_MB, MIN_CHILD_HEAP_MB, recommendedChildShareMb, } from '@qwen-code/acp-bridge/daemonMemoryBudget';
import { computeDaemonMemoryPressure, } from './daemon-memory-pressure.js';
import { isLoopbackBind } from './loopback-binds.js';
const DEFAULT_LISTENER_MAX_CONNECTIONS = 256;
const SECTION_TIMEOUT_MS = 1_000;
const CAPACITY_WARNING_RATIO = 0.8;
export function toDaemonStatusMemoryLimits(budget, childHeap) {
    if (!budget)
        return null;
    return {
        enforced: false,
        childHeap: childHeap
            ? {
                mode: childHeap.mode,
                maxConcurrentChildren: childHeap.maxConcurrentChildren,
                perChildCeilingMb: childHeap.perChildCeilingMb,
                refusals: childHeap.refusals,
            }
            : null,
        configuredBudgetMb: budget.configuredBudgetMb,
        effectiveBudgetMb: budget.effectiveBudgetMb,
        budgetSource: budget.budgetSource,
        availableMemoryMb: budget.availableMemoryMb,
        availableMemorySource: budget.availableMemorySource,
        insufficientMemory: budget.insufficientMemory,
        modeled: {
            rootReserveMb: budget.rootReserveMb,
            childPoolMb: budget.childPoolMb,
            minChildHeapMb: MIN_CHILD_HEAP_MB,
            maxChildHeapMb: MAX_CHILD_HEAP_MB,
            legacyChildCeilingMb: budget.legacyChildCeilingMb,
        },
    };
}
class SectionTimeoutError extends Error {
    section;
    timeoutMs;
    constructor(section, timeoutMs) {
        super(`${section} status timed out after ${timeoutMs}ms`);
        this.section = section;
        this.timeoutMs = timeoutMs;
        this.name = 'SectionTimeoutError';
    }
}
export function parseDaemonStatusDetail(raw) {
    if (raw === undefined)
        return { ok: true, detail: 'summary' };
    if (raw === 'summary' || raw === 'full') {
        return { ok: true, detail: raw };
    }
    return { ok: false };
}
export async function buildDaemonStatusResponse(detail, input) {
    const daemonLogStatus = input.daemonLog?.getStatus();
    const bridgeSnapshot = input.bridge.getDaemonStatusSnapshot();
    const lastActivity = input.bridge.lastActivityAt ?? null;
    const workspaceRuntimes = input.workspaceRegistry?.list();
    const workspaceSnapshots = workspaceRuntimes?.map((runtime) => ({
        workspaceCwd: runtime.workspaceCwd,
        snapshot: runtime.bridge === input.bridge
            ? bridgeSnapshot
            : runtime.bridge.getDaemonStatusSnapshot(),
        lastActivity: runtime.bridge === input.bridge
            ? lastActivity
            : (runtime.bridge.lastActivityAt ?? null),
    })) ?? [
        {
            workspaceCwd: input.boundWorkspace,
            snapshot: bridgeSnapshot,
            lastActivity,
        },
    ];
    const aggregatedSessionCount = workspaceSnapshots.reduce((sum, item) => sum + item.snapshot.sessionCount, 0);
    const aggregatedPendingPermissionCount = workspaceSnapshots.reduce((sum, item) => sum + item.snapshot.pendingPermissionCount, 0);
    const aggregatedChannelLive = workspaceSnapshots.some((item) => item.snapshot.channelLive);
    const memoryBudget = input.opts.daemonMemoryBudget;
    let runtimeMemory;
    if (memoryBudget) {
        // Count managed runtimes whose channel is live (non-dying), not what is
        // merely active-state. `list()` (active-state only) drops workspaces
        // mid-replacement or blocked, which would under-report children in exactly
        // the window an admission policy must not treat as free capacity.
        // `listManaged()` is the managed set; `listEntries()` is the registration
        // count. A workspace whose kill has started but whose child has not exited
        // is excluded (dying channel); registered-but-dormant workspaces have no
        // live child, so the registered count remains unsafe to divide by.
        const managedRuntimes = input.workspaceRegistry?.listManaged();
        const activeAcpChildCount = managedRuntimes
            ? managedRuntimes.filter((runtime) => runtime.bridge.isChannelLive())
                .length
            : workspaceSnapshots.filter((item) => item.snapshot.channelLive).length;
        const registeredWorkspaceCount = input.workspaceRegistry
            ? input.workspaceRegistry.listEntries().length
            : workspaceSnapshots.length;
        // Summed in the SAME synchronous pass that produced `activeAcpChildCount`
        // above, over the same array. Keep it that way: an `await` slipped between
        // them would not break `sampled <= activeAcpChildren` — a child that dies
        // drops out of the sum, and one that starts has no cached reading yet — it
        // would instead make the two figures describe different instants, so the
        // gap between them would quietly absorb children that came or went while
        // the response was being built. That gap is the entire reason `sampled` is
        // reported, and no assertion would catch it going wrong.
        let childRssBytesTotal = 0;
        let childRssSampled = 0;
        let oldestChildReadingAgeMs = null;
        for (const runtime of managedRuntimes ?? []) {
            // Gate on the same predicate `activeAcpChildCount` used, rather than
            // trusting `getChildResourceSnapshot` to return nothing for a dead
            // channel. It does today, but that is another package's internal, and
            // leaning on it would make `sampled <= activeAcpChildren` — the one
            // thing this block promises — hold by coincidence instead of by
            // construction.
            if (!runtime.bridge.isChannelLive())
                continue;
            const snapshot = runtime.bridge.getChildResourceSnapshot?.();
            if (!snapshot)
                continue;
            childRssBytesTotal += snapshot.rssBytes;
            childRssSampled += 1;
            // Absent on bridges predating the field; such a child still counts
            // toward the sum, it just cannot say how old its reading is.
            if (snapshot.ageMs !== undefined) {
                oldestChildReadingAgeMs = Math.max(oldestChildReadingAgeMs ?? 0, snapshot.ageMs);
            }
        }
        const pressureMode = input.opts.memoryPressureMode ?? 'observe';
        // One reading for the two figures of a single ratio. Reading twice would
        // divide an rss and a heapUsed sampled at different instants.
        //
        // Deliberately not shared with `runtime.process` further down: a
        // `detail=full` request awaits the workspace sections between here and
        // there, so reusing this snapshot would silently change which instant that
        // pre-existing field reports. A second syscall is cheaper than a semantics
        // change to a field this PR is not about.
        const pressureMemory = process.memoryUsage();
        runtimeMemory = {
            registeredWorkspaces: registeredWorkspaceCount,
            activeAcpChildren: activeAcpChildCount,
            childRssCoverage: 'active_children',
            children: {
                rssBytes: childRssBytesTotal,
                sampled: childRssSampled,
                oldestReadingAgeMs: oldestChildReadingAgeMs,
            },
            modeled: {
                recommendedShareAtRegisteredMb: registeredWorkspaceCount > 0
                    ? recommendedChildShareMb(memoryBudget, registeredWorkspaceCount)
                    : null,
                recommendedShareAtActiveMb: activeAcpChildCount > 0
                    ? recommendedChildShareMb(memoryBudget, activeAcpChildCount)
                    : null,
            },
            pressure: {
                ...computeDaemonMemoryPressure({
                    rssBytes: pressureMemory.rss,
                    heapUsedBytes: pressureMemory.heapUsed,
                    // `availableMemoryMb`, not `effectiveBudgetMb`: pressure asks how
                    // close this process is to being killed, and what kills it is the
                    // cgroup limit or host memory. An operator's budget is a policy
                    // number — exceeding it is not fatal, so classifying against it
                    // would report `critical` for a daemon in no danger.
                    // Note the unit change: the budget carries megabytes.
                    availableBytes: memoryBudget.availableMemoryMb * 1024 * 1024,
                }),
                // After the spread, so the flag stays authoritative if the computed
                // shape ever grows a field of this name.
                mode: pressureMode,
            },
        };
    }
    const aggregatedLastActivity = workspaceSnapshots.reduce((latest, item) => item.lastActivity !== null &&
        (latest === null || item.lastActivity > latest)
        ? item.lastActivity
        : latest, null);
    const acpSnapshot = input.acpHandle?.registry.getSnapshot();
    // Aggregate across all mounts (primary + trusted secondaries) so the transport
    // summary matches the metrics sampler; the connection cap below stays
    // primary-scoped because it is the uniform per-mount cap.
    const acpAggregate = input.acpHandle?.getSnapshot();
    const rateLimitHits = input.rateLimiter?.getHitCounts() ?? zeroRateHits();
    let pendingPrompts = 0;
    let derivedQueuedPrompts = 0;
    const derivedQueuedPromptsByWorkspace = [];
    for (const [index, { snapshot }] of workspaceSnapshots.entries()) {
        let derivedQueuedPromptsForWorkspace = 0;
        for (const session of snapshot.sessions) {
            pendingPrompts += session.pendingPromptCount;
            const sessionQueuedPrompts = Math.max(0, session.pendingPromptCount - (session.hasActivePrompt ? 1 : 0));
            derivedQueuedPrompts += sessionQueuedPrompts;
            derivedQueuedPromptsForWorkspace += sessionQueuedPrompts;
        }
        derivedQueuedPromptsByWorkspace[index] = derivedQueuedPromptsForWorkspace;
    }
    const queuedPrompts = workspaceRuntimes?.reduce((sum, runtime, index) => sum +
        (runtime.bridge.pendingPromptTotal ??
            derivedQueuedPromptsByWorkspace[index] ??
            0), 0) ??
        input.bridge.pendingPromptTotal ??
        derivedQueuedPrompts;
    const channelWorker = input.getChannelWorkerSnapshot?.() ?? {
        enabled: false,
        state: 'disabled',
        channels: [],
    };
    // Per-workspace worker list is multi-workspace only; single-workspace status
    // keeps the byte-identical `channelWorker` shape.
    const channelWorkers = (workspaceRuntimes?.length ?? 1) > 1
        ? input.getChannelWorkerSnapshots?.()
        : undefined;
    const totalAdmissionSnapshot = input.getTotalSessionAdmissionSnapshot?.();
    const issues = [];
    let full;
    pushRuntimeIssues(issues, acpSnapshot, acpAggregate, rateLimitHits, input, channelWorker, channelWorkers, totalAdmissionSnapshot, workspaceSnapshots);
    // Only `observe` turns the level into an issue. `off` still reported the
    // figures above; what it withholds is the effect on `rollupStatus`, which
    // any one issue flips from `ok` to `warning`. The thresholds are inherited
    // from an interactive-CLI monitor and are not yet calibrated for a
    // long-running daemon, so a deployment that alerts on the top-level status
    // needs a way to take the reading without the verdict.
    if (runtimeMemory &&
        runtimeMemory.pressure.mode === 'observe' &&
        runtimeMemory.pressure.level !== 'normal') {
        const { level, ratio, source } = runtimeMemory.pressure;
        issues.push({
            code: 'daemon_memory_pressure',
            // `warning` at every level, including `critical`. An `error` severity
            // makes `rollupStatus` return `error` for the whole daemon, which is a
            // strong claim to stake on thresholds borrowed from an interactive-CLI
            // monitor and not yet calibrated here. The level itself is reported in
            // `runtime.memory.pressure`, so nothing is lost by keeping the rollup
            // at `warning` until the numbers have been checked against real
            // deployments — which is what this phase is for.
            severity: 'warning',
            // Name the denominator, not the numerator: "% of the rss limit" would
            // call the measured value a limit. `section` is omitted because every
            // other use of it names a workspace status section, and this is a
            // daemon-level concern — the same reason `daemon_log_degraded` omits it.
            // One decimal, not zero: at 0 decimals a ratio of 0.795 rounds to "80%"
            // while `level` still reads `hard`, and 80% is critical's documented
            // threshold. An oncall engineer comparing the two sees a contradiction
            // in the one feature whose whole purpose is trustworthy triage.
            message: `Daemon memory pressure is ${level} at ` +
                `${(ratio * 100).toFixed(1)}% of ` +
                `${source === 'heap' ? 'the V8 heap limit' : 'available memory'}.`,
        });
    }
    if (daemonLogStatus?.health === 'degraded') {
        issues.push({
            code: 'daemon_log_degraded',
            severity: 'warning',
            message: 'Daemon file logging is degraded; inspect full status for details.',
        });
    }
    if (detail === 'full') {
        full = await buildFullStatus(input, acpAggregate, workspaceSnapshots.flatMap((item) => item.snapshot.sessions));
        pushFullIssues(issues, full);
    }
    return {
        v: 1,
        detail,
        generatedAt: new Date().toISOString(),
        status: rollupStatus(issues),
        issues,
        daemon: {
            pid: process.pid,
            uptimeMs: Math.round(process.uptime() * 1000),
            mode: input.opts.mode,
            workspaceCwd: input.boundWorkspace,
            ...(input.startup ? { startup: cloneStartup(input.startup) } : {}),
            ...(input.qwenCodeVersion
                ? { qwenCodeVersion: input.qwenCodeVersion }
                : {}),
            ...(input.daemonLog?.getDaemonId()
                ? { daemonId: input.daemonLog.getDaemonId() }
                : {}),
            ...(daemonLogStatus
                ? {
                    runId: daemonLogStatus.runId,
                    logMode: daemonLogStatus.mode,
                    logHealth: daemonLogStatus.health,
                }
                : {}),
            ...(detail === 'full' && input.daemonLog?.getLogPath()
                ? { logPath: input.daemonLog.getLogPath() }
                : {}),
            ...(detail === 'full' && daemonLogStatus
                ? {
                    logIssues: daemonLogStatus.issues,
                    logDroppedRecords: daemonLogStatus.droppedRecords,
                    logDroppedBytes: daemonLogStatus.droppedBytes,
                }
                : {}),
        },
        security: {
            tokenConfigured: Boolean(input.opts.token),
            requireAuth: input.opts.requireAuth === true,
            loopbackBind: isLoopbackBind(input.opts.hostname),
            allowOriginConfigured: input.opts.allowOrigins !== undefined &&
                input.opts.allowOrigins.length > 0,
            allowOriginMode: allowOriginMode(input.opts.allowOrigins),
            sessionShellCommandEnabled: input.sessionShellCommandEnabled,
        },
        limits: {
            maxSessions: bridgeSnapshot.limits.maxSessions,
            maxTotalSessions: positiveFiniteOrNull(input.opts.maxTotalSessions),
            maxPendingPromptsPerSession: bridgeSnapshot.limits.maxPendingPromptsPerSession,
            listenerMaxConnections: listenerMaxConnections(input.opts.maxConnections),
            eventRingSize: bridgeSnapshot.limits.eventRingSize,
            compactedReplayMaxBytes: bridgeSnapshot.limits.compactedReplayMaxBytes,
            maxJournalEvents: bridgeSnapshot.limits.maxJournalEvents,
            maxJournalBytes: bridgeSnapshot.limits.maxJournalBytes,
            promptDeadlineMs: positiveFiniteOrNull(input.opts.promptDeadlineMs),
            writerIdleTimeoutMs: positiveFiniteOrNull(input.opts.writerIdleTimeoutMs),
            channelIdleTimeoutMs: bridgeSnapshot.limits.channelIdleTimeoutMs,
            sessionIdleTimeoutMs: bridgeSnapshot.limits.sessionIdleTimeoutMs,
            acpConnectionCap: acpSnapshot?.connectionCap ?? null,
            memory: toDaemonStatusMemoryLimits(memoryBudget, input.getChildHeapPolicySnapshot?.()),
        },
        ...(workspaceRuntimes && workspaceRuntimes.length > 1
            ? {
                workspaces: workspaceRuntimes.map((runtime) => ({
                    id: runtime.workspaceId,
                    cwd: runtime.workspaceCwd,
                    ...(runtime.displayName !== undefined
                        ? { displayName: runtime.displayName }
                        : {}),
                    primary: runtime.primary,
                    trusted: runtime.trusted,
                })),
            }
            : {}),
        capabilities: {
            protocolVersions: input.protocolVersions,
            features: [...input.features],
        },
        runtime: {
            sessions: {
                active: aggregatedSessionCount,
                ...(totalAdmissionSnapshot
                    ? { admissionInFlight: totalAdmissionSnapshot.inFlight }
                    : {}),
            },
            permissions: {
                pending: aggregatedPendingPermissionCount,
                policy: bridgeSnapshot.permissionPolicy,
            },
            channel: { live: aggregatedChannelLive },
            channelWorker,
            ...(channelWorkers && channelWorkers.length > 0
                ? { channelWorkers }
                : {}),
            transport: {
                restSseActive: input.getRestSseActive(),
                acp: {
                    enabled: acpSnapshot !== undefined,
                    connections: acpAggregate?.connectionCount ?? 0,
                    connectionStreams: acpAggregate?.connectionStreams ?? 0,
                    sessionStreams: acpAggregate?.sessionStreams ?? 0,
                    sseStreams: acpAggregate?.sseStreams ?? 0,
                    wsStreams: acpAggregate?.wsStreams ?? 0,
                    pendingClientRequests: acpAggregate?.pendingClientRequests ?? 0,
                },
            },
            rateLimit: {
                enabled: input.opts.rateLimit === true,
                rejectedSinceStart: rateLimitHits,
            },
            ...(input.getPerfSnapshot ? { perf: input.getPerfSnapshot() } : {}),
            ...(input.getMetricsSeries
                ? { metrics: { series: input.getMetricsSeries() } }
                : {}),
            activity: {
                activePrompts: workspaceRuntimes?.reduce((sum, runtime) => sum + (runtime.bridge.activePromptCount ?? 0), 0) ??
                    input.bridge.activePromptCount ??
                    0,
                pendingPrompts,
                queuedPrompts,
                lastActivityAt: aggregatedLastActivity !== null
                    ? new Date(aggregatedLastActivity).toISOString()
                    : null,
                idleSinceMs: aggregatedLastActivity !== null
                    ? Date.now() - aggregatedLastActivity
                    : null,
            },
            ...(runtimeMemory ? { memory: runtimeMemory } : {}),
            process: process.memoryUsage(),
        },
        ...(full ? { full } : {}),
    };
}
function cloneStartup(startup) {
    return {
        processStartedAt: startup.processStartedAt,
        ...(startup.listenerReadyAt
            ? { listenerReadyAt: startup.listenerReadyAt }
            : {}),
        ...(startup.processToListenMs !== undefined
            ? { processToListenMs: startup.processToListenMs }
            : {}),
        ...(startup.runQwenServeToListenMs !== undefined
            ? { runQwenServeToListenMs: startup.runQwenServeToListenMs }
            : {}),
        preheat: {
            status: startup.preheat.status,
            ...(startup.preheat.durationMs !== undefined
                ? { durationMs: startup.preheat.durationMs }
                : {}),
            ...(startup.preheat.error ? { error: startup.preheat.error } : {}),
        },
    };
}
async function buildFullStatus(input, acpSnapshot, sessions) {
    const ctx = {
        route: 'GET /daemon/status',
        workspaceCwd: input.boundWorkspace,
    };
    const [mcp, skills, tools, providers, env, preflight, hooks, extensions] = await Promise.all([
        collectSection('workspace.mcp', () => input.workspace.getWorkspaceMcpStatus(ctx)),
        collectSection('workspace.skills', () => input.workspace.getWorkspaceSkillsStatus(ctx)),
        collectSection('workspace.tools', () => input.bridge.getWorkspaceToolsStatus()),
        collectSection('workspace.providers', () => input.workspace.getWorkspaceProvidersStatus(ctx)),
        collectSection('workspace.env', () => input.workspace.getWorkspaceEnvStatus(ctx)),
        collectSection('workspace.preflight', () => input.workspace.getWorkspacePreflightStatus(ctx)),
        collectSection('workspace.hooks', () => input.workspace.getWorkspaceHooksStatus(ctx)),
        collectSection('workspace.extensions', () => input.workspace.getWorkspaceExtensionsStatus(ctx)),
    ]);
    return {
        sessions,
        acpConnections: acpSnapshot?.connections ?? [],
        workspace: {
            mcp,
            skills,
            tools,
            providers,
            env,
            preflight,
            hooks,
            extensions,
        },
        auth: {
            supportedDeviceFlowProviders: [...input.supportedDeviceFlowProviders],
            pendingDeviceFlowCount: input.deviceFlowRegistry.listPending().length,
        },
    };
}
async function collectSection(name, read) {
    const startMs = Date.now();
    try {
        const data = await withTimeout(read(), name, SECTION_TIMEOUT_MS);
        return {
            status: inferSectionStatus(data),
            durationMs: Date.now() - startMs,
            summary: summarizeStatusData(data),
            data,
        };
    }
    catch (err) {
        return {
            status: 'unavailable',
            durationMs: Date.now() - startMs,
            error: {
                kind: err instanceof SectionTimeoutError ? 'timeout' : 'error',
                message: err instanceof Error ? err.message : String(err),
            },
        };
    }
}
async function withTimeout(promise, section, timeoutMs) {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((_resolve, reject) => {
                timer = setTimeout(() => reject(new SectionTimeoutError(section, timeoutMs)), timeoutMs);
            }),
        ]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
function pushRuntimeIssues(issues, acpSnapshot, acpAggregate, rateLimitHits, input, channelWorker, channelWorkers, totalAdmissionSnapshot, workspaceSnapshots) {
    for (const { workspaceCwd, snapshot } of workspaceSnapshots) {
        if (snapshot.limits.maxSessions !== null &&
            snapshot.limits.maxSessions > 0 &&
            snapshot.sessionCount / snapshot.limits.maxSessions >=
                CAPACITY_WARNING_RATIO) {
            issues.push({
                code: 'session_capacity_high',
                severity: 'warning',
                message: workspaceSnapshots.length > 1
                    ? `Workspace ${workspaceCwd} active sessions are at ${snapshot.sessionCount}/${snapshot.limits.maxSessions}.`
                    : `Active sessions are at ${snapshot.sessionCount}/${snapshot.limits.maxSessions}.`,
            });
        }
    }
    const maxTotalSessions = positiveFiniteOrNull(input.opts.maxTotalSessions);
    if (maxTotalSessions !== null) {
        const fallbackLiveCount = workspaceSnapshots.reduce((sum, item) => sum + item.snapshot.sessionCount, 0);
        const totalActive = (totalAdmissionSnapshot?.liveCount ?? fallbackLiveCount) +
            (totalAdmissionSnapshot?.inFlight ?? 0);
        if (totalActive / maxTotalSessions >= CAPACITY_WARNING_RATIO) {
            issues.push({
                code: 'total_session_capacity_high',
                severity: 'warning',
                message: `Total active and in-flight sessions are at ${totalActive}/${maxTotalSessions}.`,
            });
        }
    }
    if (acpSnapshot !== undefined &&
        acpSnapshot.connectionCap !== null &&
        acpSnapshot.connectionCap > 0) {
        // Per-mount cap is uniform (opts.maxConnections); warn on the busiest mount
        // so a saturated secondary workspace is visible, not just the primary's.
        const cap = acpSnapshot.connectionCap;
        const busiest = (acpAggregate?.mounts ?? []).reduce((max, m) => Math.max(max, m.connectionCount), acpSnapshot.connectionCount);
        if (busiest / cap >= CAPACITY_WARNING_RATIO) {
            issues.push({
                code: 'connection_capacity_high',
                severity: 'warning',
                message: `ACP connections are at ${busiest}/${cap} on the busiest workspace mount.`,
            });
        }
    }
    const pendingPermissionCount = workspaceSnapshots.reduce((sum, item) => sum + item.snapshot.pendingPermissionCount, 0);
    if (pendingPermissionCount > 0) {
        issues.push({
            code: 'pending_permissions',
            severity: 'warning',
            message: `${pendingPermissionCount} permission request(s) are pending.`,
        });
    }
    const downWorkspaces = workspaceSnapshots.filter((item) => item.snapshot.sessionCount > 0 && !item.snapshot.channelLive);
    if (downWorkspaces.length > 0) {
        issues.push({
            code: 'acp_channel_down',
            severity: 'error',
            message: downWorkspaces.length === 1
                ? `Active sessions exist but the ACP channel is not live for ${downWorkspaces[0].workspaceCwd}.`
                : `Active sessions exist but the ACP channel is not live for ${downWorkspaces.length} workspace(s).`,
        });
    }
    if (input.opts.rateLimit === true && sumRateHits(rateLimitHits) > 0) {
        issues.push({
            code: 'rate_limit_hits',
            severity: 'warning',
            message: `${sumRateHits(rateLimitHits)} request(s) have been rejected by rate limiting since start.`,
        });
    }
    const groupedWorkers = channelWorkers && channelWorkers.length > 0 ? channelWorkers : undefined;
    const workers = groupedWorkers ?? [channelWorker];
    for (const worker of workers) {
        pushChannelWorkerIssues(issues, worker, groupedWorkers !== undefined);
    }
}
function pushChannelWorkerIssues(issues, channelWorker, grouped) {
    const workspace = 'workspaceCwd' in channelWorker
        ? ` for workspace ${channelWorker.workspaceCwd}`
        : '';
    const section = grouped ? 'runtime.channelWorkers' : 'runtime.channelWorker';
    if (channelWorker.enabled &&
        (channelWorker.state === 'exited' || channelWorker.state === 'failed')) {
        const detailParts = [
            channelWorker.pid !== undefined ? `pid=${channelWorker.pid}` : undefined,
            channelWorker.exitCode !== undefined
                ? `code=${channelWorker.exitCode ?? 'null'}`
                : undefined,
            channelWorker.signal ? `signal=${channelWorker.signal}` : undefined,
            channelWorker.restartCount !== undefined
                ? `restarts=${channelWorker.restartCount}`
                : undefined,
            channelWorker.lastExitAt
                ? `lastExitAt=${channelWorker.lastExitAt}`
                : undefined,
            channelWorker.lastRestartAt
                ? `lastRestartAt=${channelWorker.lastRestartAt}`
                : undefined,
            channelWorker.nextRestartAt
                ? `nextRestartAt=${channelWorker.nextRestartAt}`
                : undefined,
            channelWorker.lastHeartbeatAt
                ? `lastHeartbeatAt=${channelWorker.lastHeartbeatAt}`
                : undefined,
            channelWorker.staleHeartbeatAt
                ? `staleHeartbeatAt=${channelWorker.staleHeartbeatAt}`
                : undefined,
        ].filter(Boolean);
        const details = detailParts.length > 0 ? ` (${detailParts.join(', ')})` : '';
        const error = channelWorker.error ? `: ${channelWorker.error}` : '';
        const isPermanentFailure = channelWorker.state === 'failed' && !channelWorker.nextRestartAt;
        issues.push({
            code: 'channel_worker_exited',
            severity: isPermanentFailure ? 'error' : 'warning',
            message: `Channel worker${workspace} is ${channelWorker.state}${details}${error}.`,
            section,
        });
    }
    if (channelWorker.enabled &&
        channelWorker.state === 'running' &&
        channelWorker.requestedChannels !== undefined) {
        const connected = new Set(channelWorker.channels);
        const failed = channelWorker.requestedChannels.filter((channel) => !connected.has(channel));
        if (failed.length > 0) {
            issues.push({
                code: 'channel_worker_partial_connect',
                severity: 'warning',
                message: `Channel worker${workspace} connected ${channelWorker.channels.length}/${channelWorker.requestedChannels.length} channel(s). ` +
                    `Failed: ${failed.join(', ')}.`,
                section,
            });
        }
    }
}
function pushFullIssues(issues, full) {
    for (const [name, section] of Object.entries(full.workspace)) {
        if (section.status === 'unavailable') {
            issues.push({
                code: 'workspace_status_unavailable',
                severity: 'warning',
                section: name,
                message: `${name} status is unavailable.`,
            });
        }
    }
    const preflight = full.workspace['preflight'];
    if (preflight && sectionHasStatus(preflight, 'error')) {
        issues.push({
            code: 'preflight_error',
            severity: 'error',
            section: 'preflight',
            message: 'Workspace preflight reports an error.',
        });
    }
    const mcp = full.workspace['mcp'];
    const mcpBudget = mcp ? inspectMcpBudget(mcp) : undefined;
    if (mcpBudget === 'exhausted') {
        issues.push({
            code: 'mcp_budget_exhausted',
            severity: 'error',
            section: 'mcp',
            message: 'MCP client budget is exhausted.',
        });
    }
    else if (mcpBudget === 'warning') {
        issues.push({
            code: 'mcp_budget_warning',
            severity: 'warning',
            section: 'mcp',
            message: 'MCP client budget is near capacity.',
        });
    }
}
function inferSectionStatus(data) {
    const statuses = collectStatuses(data);
    if (statuses.includes('error'))
        return 'error';
    if (statuses.includes('warning'))
        return 'warning';
    return 'ok';
}
function summarizeStatusData(data) {
    const summary = {};
    if (!isRecord(data))
        return summary;
    copyBoolean(data, summary, 'initialized');
    copyBoolean(data, summary, 'acpChannelLive');
    copyString(data, summary, 'discoveryState');
    copyString(data, summary, 'budgetMode');
    copyNumber(data, summary, 'clientCount');
    copyNumber(data, summary, 'clientBudget');
    for (const key of [
        'cells',
        'errors',
        'servers',
        'budgets',
        'skills',
        'tools',
        'providers',
        'hooks',
        'extensions',
    ]) {
        const value = data[key];
        if (Array.isArray(value)) {
            summary[`${key}Count`] = value.length;
        }
    }
    summarizeMcpServers(data, summary);
    return summary;
}
function summarizeMcpServers(data, summary) {
    const servers = data['servers'];
    if (!Array.isArray(servers))
        return;
    let connected = 0;
    let errored = 0;
    let disabled = 0;
    for (const server of servers) {
        if (!isRecord(server))
            continue;
        if (server['disabled'] === true) {
            disabled++;
        }
        else if (server['status'] === 'error') {
            errored++;
        }
        else if (server['mcpStatus'] === 'connected') {
            connected++;
        }
    }
    summary['serversConnected'] = connected;
    summary['serversErrored'] = errored;
    summary['serversDisabled'] = disabled;
}
function collectStatuses(data) {
    const statuses = [];
    visitStatusContainers(data, (record) => {
        const status = record['status'];
        if (typeof status === 'string')
            statuses.push(status);
    });
    return statuses;
}
function sectionHasStatus(section, status) {
    return collectStatuses(section.data).includes(status);
}
function inspectMcpBudget(section) {
    const data = section.data;
    if (!isRecord(data))
        return undefined;
    const budgetIssue = inspectBudgetContainers(data);
    if (budgetIssue)
        return budgetIssue;
    const clientCount = numberValue(data['clientCount']);
    const clientBudget = numberValue(data['clientBudget']);
    if (clientCount !== undefined &&
        clientBudget !== undefined &&
        clientBudget > 0) {
        const ratio = clientCount / clientBudget;
        if (ratio >= 1)
            return 'exhausted';
        if (ratio >= 0.75)
            return 'warning';
    }
    return undefined;
}
function inspectBudgetContainers(data) {
    let result;
    visitStatusContainers(data, (record) => {
        if (result === 'exhausted')
            return;
        const errorKind = record['errorKind'];
        const disabledReason = record['disabledReason'];
        const status = record['status'];
        const kind = record['kind'];
        const refusedCount = numberValue(record['refusedCount']);
        if (errorKind === 'budget_exhausted' ||
            disabledReason === 'budget' ||
            (kind === 'mcp_budget' && status === 'error') ||
            (refusedCount !== undefined && refusedCount > 0)) {
            result = 'exhausted';
            return;
        }
        if (kind === 'mcp_budget' && status === 'warning') {
            result = 'warning';
        }
    });
    return result;
}
function visitStatusContainers(data, visit) {
    if (!isRecord(data))
        return;
    visit(data);
    for (const key of [
        'cells',
        'errors',
        'servers',
        'budgets',
        'skills',
        'tools',
        'providers',
        'hooks',
        'extensions',
    ]) {
        const value = data[key];
        if (!Array.isArray(value))
            continue;
        for (const item of value)
            visitStatusContainers(item, visit);
    }
}
function rollupStatus(issues) {
    if (issues.some((issue) => issue.severity === 'error'))
        return 'error';
    if (issues.length > 0)
        return 'warning';
    return 'ok';
}
export function allowOriginMode(allowOrigins) {
    if (!allowOrigins || allowOrigins.length === 0)
        return 'none';
    return allowOrigins.includes('*') ? 'any' : 'specific';
}
export function listenerMaxConnections(value) {
    if (value === undefined)
        return DEFAULT_LISTENER_MAX_CONNECTIONS;
    if (value === 0 || value === Infinity)
        return null;
    return Number.isFinite(value) && value > 0 ? value : null;
}
export function positiveFiniteOrNull(value) {
    return value !== undefined && Number.isFinite(value) && value > 0
        ? value
        : null;
}
function zeroRateHits() {
    return { prompt: 0, mutation: 0, read: 0 };
}
function sumRateHits(hits) {
    return hits.prompt + hits.mutation + hits.read;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function numberValue(value) {
    return typeof value === 'number' && Number.isFinite(value)
        ? value
        : undefined;
}
function copyBoolean(from, to, key) {
    const value = from[key];
    if (typeof value === 'boolean')
        to[key] = value;
}
function copyString(from, to, key) {
    const value = from[key];
    if (typeof value === 'string')
        to[key] = value;
}
function copyNumber(from, to, key) {
    const value = numberValue(from[key]);
    if (value !== undefined)
        to[key] = value;
}
//# sourceMappingURL=daemon-status.js.map