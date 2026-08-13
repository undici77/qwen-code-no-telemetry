/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { writeStderrLine } from '../../utils/stdioHelpers.js';
import { sendGenerationClosedError, sendUntrustedWorkspaceResponse, } from '../workspace-route-runtime.js';
/**
 * Ceiling on in-flight `sessionGoalGet` probes. Each is an IPC round-trip to a
 * separate child process, so a workspace with dozens of live sessions would
 * otherwise open dozens at once every poll.
 */
const PROBE_CONCURRENCY = 10;
/**
 * `Promise.allSettled` over `items`, but with at most `limit` calls in flight.
 * Results stay index-aligned with `items` so the caller can still name the
 * session behind a rejection.
 */
async function allSettledWithLimit(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            try {
                results[index] = { status: 'fulfilled', value: await fn(items[index]) };
            }
            catch (reason) {
                results[index] = { status: 'rejected', reason };
            }
        }
    };
    // `Math.max(1, …)` so a zero limit can never leave the array sparse: the
    // caller reads `outcome.status` off every index.
    const workers = Math.min(Math.max(1, limit), items.length);
    await Promise.all(Array.from({ length: workers }, worker));
    return results;
}
export function registerGoalsRoutes(app, deps) {
    const { boundWorkspace, bridge } = deps;
    app.get('/goals', async (_req, res) => {
        if (deps.isWorkspaceTrusted?.() === false) {
            sendUntrustedWorkspaceResponse(res);
            return;
        }
        const assertGenerationOpen = deps.captureGenerationAssertion?.();
        try {
            assertGenerationOpen?.();
            const sessions = bridge.listWorkspaceSessions(boundWorkspace);
            const settled = await allSettledWithLimit(sessions, PROBE_CONCURRENCY, async (session) => ({
                session,
                goal: await bridge.getSessionGoal(session.sessionId),
            }));
            const goals = [];
            const dropped = [];
            for (const [index, outcome] of settled.entries()) {
                // A session that died between the list and the probe simply has no
                // goal to report. Dropping it keeps one bad session from hiding the
                // others, but do not drop it silently: an empty page and a page whose
                // probes all failed look identical from the client.
                if (outcome.status !== 'fulfilled') {
                    const sessionId = sessions[index]?.sessionId ?? '(unknown)';
                    const reason = outcome.reason instanceof Error
                        ? outcome.reason.message
                        : String(outcome.reason);
                    dropped.push(`${sessionId}: ${reason}`);
                    continue;
                }
                const { session, goal } = outcome.value;
                if (!goal.active)
                    continue;
                goals.push({
                    sessionId: session.sessionId,
                    displayName: session.displayName ?? null,
                    condition: goal.active.condition,
                    iterations: goal.active.iterations,
                    setAt: goal.active.setAt,
                    ...(goal.active.lastReason !== undefined
                        ? { lastReason: goal.active.lastReason }
                        : {}),
                    hasActivePrompt: session.hasActivePrompt,
                });
            }
            if (dropped.length > 0) {
                writeStderrLine(`qwen serve: GET /goals could not probe ${dropped.length} of ${sessions.length} session(s): ${dropped.join('; ')}`);
            }
            // Newest first, matching the scheduled-tasks page.
            goals.sort((a, b) => b.setAt - a.setAt);
            // `droppedCount` lets the client tell "no goals" apart from "we could not
            // ask". Without it a brownout looks like an empty workspace, and the user
            // re-creates goals that are already running.
            assertGenerationOpen?.();
            res.status(200).json({ v: 1, goals, droppedCount: dropped.length });
        }
        catch (err) {
            if (sendGenerationClosedError(res, err))
                return;
            writeStderrLine(`qwen serve: GET /goals failed: ${err instanceof Error ? err.message : String(err)}`);
            res.status(500).json({
                error: 'Failed to list active goals',
                code: 'goals_read_failed',
            });
        }
    });
}
//# sourceMappingURL=goals.js.map