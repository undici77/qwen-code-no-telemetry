/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { writeStderrLine } from '../../utils/stdioHelpers.js';
import { buildDaemonStatusResponse, parseDaemonStatusDetail, } from '../daemon-status.js';
import { getServeProtocolVersions } from '../capabilities.js';
export function registerDaemonStatusRoutes(app, deps) {
    app.get('/daemon/status', async (req, res) => {
        const detail = parseDaemonStatusDetail(req.query['detail']);
        if (!detail.ok || !detail.detail) {
            res.status(400).json({
                error: 'detail must be one of: summary, full',
                code: 'invalid_detail',
            });
            return;
        }
        try {
            res.status(200).json(await buildDaemonStatusResponse(detail.detail, {
                opts: deps.opts,
                boundWorkspace: deps.boundWorkspace,
                bridge: deps.bridge,
                workspaceRegistry: deps.workspaceRegistry,
                workspace: deps.workspace,
                daemonLog: deps.daemonLog,
                startup: deps.startup,
                qwenCodeVersion: deps.qwenCodeVersion,
                acpHandle: deps.getAcpHandle(),
                rateLimiter: deps.getRateLimiter(),
                getRestSseActive: deps.getRestSseActive,
                features: deps.currentServeFeatures(),
                protocolVersions: getServeProtocolVersions(),
                supportedDeviceFlowProviders: deps.getSupportedDeviceFlowProviders(),
                deviceFlowRegistry: deps.deviceFlowRegistry,
                sessionShellCommandEnabled: deps.sessionShellCommandEnabled,
                getChannelWorkerSnapshot: deps.getChannelWorkerSnapshot,
                getChannelWorkerSnapshots: deps.getChannelWorkerSnapshots,
                getPerfSnapshot: deps.getPerfSnapshot,
                getMetricsSeries: deps.getMetricsSeries,
                getTotalSessionAdmissionSnapshot: deps.getTotalSessionAdmissionSnapshot,
                getChildHeapPolicySnapshot: deps.getChildHeapPolicySnapshot,
            }));
        }
        catch (err) {
            writeStderrLine(`qwen serve: /daemon/status failed: ${err instanceof Error ? err.message : String(err)}`);
            res.status(500).json({
                error: 'Failed to build daemon status',
                code: 'daemon_status_failed',
            });
        }
    });
}
//# sourceMappingURL=daemon-status.js.map