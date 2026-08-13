/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import express, {} from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createWorkspaceRegistry, } from '../workspace-registry.js';
import { registerWorkspaceQualifiedTrustRoutes } from './workspace-trust.js';
function runtime(provenance, primary = false) {
    return {
        workspaceId: `id-${provenance}-${primary ? 'primary' : 'secondary'}`,
        workspaceCwd: `/workspace/${provenance}-${primary ? 'primary' : 'secondary'}`,
        primary,
        trusted: true,
        provenance,
        env: { mode: 'parent-process', overlayKeys: [] },
        bridge: {},
        workspaceService: {
            getWorkspaceTrustStatus: vi.fn(),
            requestWorkspaceTrustChange: vi.fn(),
        },
        routeFileSystemFactory: {},
        clientMcpSenderRegistry: {},
    };
}
describe('workspace trust routes', () => {
    it.each([
        [
            'managed-scratch',
            'managed_scratch_trust_fixed',
            'Managed scratch workspace trust cannot be changed',
        ],
        [
            'live-conversation',
            'live_conversation_trust_fixed',
            'Live conversation workspace trust cannot be changed',
        ],
    ])('rejects manual trust changes for %s provenance', async (provenance, code, error) => {
        const selected = runtime(provenance);
        const primary = runtime('existing', true);
        const app = express();
        app.use(express.json());
        registerWorkspaceQualifiedTrustRoutes(app, {
            workspaceRegistry: createWorkspaceRegistry([primary, selected]),
            mutate: () => ((_req, _res, next) => next()),
            safeBody: (req) => req.body,
        });
        const response = await request(app)
            .post(`/workspaces/${encodeURIComponent(selected.workspaceId)}/trust/request`)
            .send({ desiredState: 'untrusted' });
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ code, error });
        expect(selected.workspaceService.requestWorkspaceTrustChange).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=workspace-trust.test.js.map