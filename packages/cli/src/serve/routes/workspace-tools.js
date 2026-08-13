/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createBuildWorkspaceCtx, MAX_TOOL_NAME_LENGTH, parseAndValidateWorkspaceClientId, } from '../server/request-helpers.js';
import { requireTrustedWorkspaceRuntime, resolveWorkspaceRuntimeFromParam, sendGenerationClosedError, } from '../workspace-route-runtime.js';
export function registerWorkspaceToolsRoutes(app, deps) {
    const { boundWorkspace, workspace, mutate, safeBody, sendBridgeError, parseAndValidateClientId, } = deps;
    const buildWorkspaceCtx = createBuildWorkspaceCtx(boundWorkspace);
    app.post('/workspace/tools/:name/enable', mutate({ strict: true }), async (req, res) => {
        const assertGenerationOpen = deps.captureGenerationAssertion?.() ?? (() => { });
        try {
            assertGenerationOpen();
        }
        catch (err) {
            if (sendGenerationClosedError(res, err))
                return;
            throw err;
        }
        if (deps.isWorkspaceTrusted?.() === false) {
            res.status(403).json({
                error: 'Workspace is not trusted.',
                code: 'untrusted_workspace',
            });
            return;
        }
        const rawToolName = req.params['name'];
        if (!rawToolName || typeof rawToolName !== 'string') {
            res.status(400).json({
                error: 'Tool name path parameter is required',
                code: 'invalid_tool_name',
            });
            return;
        }
        const toolName = rawToolName.trim();
        if (toolName.length === 0) {
            res.status(400).json({
                error: 'Tool name path parameter is required',
                code: 'invalid_tool_name',
            });
            return;
        }
        if (toolName.length > MAX_TOOL_NAME_LENGTH) {
            res.status(400).json({
                error: `Tool name exceeds ${MAX_TOOL_NAME_LENGTH}-character limit`,
                code: 'invalid_tool_name',
            });
            return;
        }
        const body = safeBody(req);
        const enabled = body['enabled'];
        if (typeof enabled !== 'boolean') {
            res.status(400).json({
                error: '`enabled` is required and must be a boolean',
                code: 'invalid_enabled_flag',
            });
            return;
        }
        const clientId = parseAndValidateClientId(req, res);
        if (clientId === null)
            return;
        try {
            const ctx = buildWorkspaceCtx('POST /workspace/tools/:name/enable', clientId);
            const result = await workspace.setWorkspaceToolEnabled(ctx, toolName, enabled);
            res.status(200).json(result);
        }
        catch (err) {
            sendBridgeError(res, err, {
                route: 'POST /workspace/tools/:name/enable',
            });
        }
    });
}
export function registerWorkspaceQualifiedToolsRoutes(app, deps) {
    app.post('/workspaces/:workspace/tools/:name/enable', deps.mutate({ strict: true }), async (req, res) => {
        const runtime = resolveWorkspaceRuntimeFromParam(deps.workspaceRegistry, req, res);
        if (!runtime || !requireTrustedWorkspaceRuntime(runtime, res))
            return;
        const rawToolName = req.params['name'];
        if (!rawToolName || typeof rawToolName !== 'string') {
            res.status(400).json({
                error: 'Tool name path parameter is required',
                code: 'invalid_tool_name',
            });
            return;
        }
        const toolName = rawToolName.trim();
        if (toolName.length === 0) {
            res.status(400).json({
                error: 'Tool name path parameter is required',
                code: 'invalid_tool_name',
            });
            return;
        }
        if (toolName.length > MAX_TOOL_NAME_LENGTH) {
            res.status(400).json({
                error: `Tool name exceeds ${MAX_TOOL_NAME_LENGTH}-character limit`,
                code: 'invalid_tool_name',
            });
            return;
        }
        const body = deps.safeBody(req);
        const enabled = body['enabled'];
        if (typeof enabled !== 'boolean') {
            res.status(400).json({
                error: '`enabled` is required and must be a boolean',
                code: 'invalid_enabled_flag',
            });
            return;
        }
        const clientId = parseAndValidateWorkspaceClientId(req, res, runtime.bridge);
        if (clientId === null)
            return;
        const route = 'POST /workspaces/:workspace/tools/:name/enable';
        try {
            const ctx = createBuildWorkspaceCtx(runtime.workspaceCwd)(route, clientId);
            const result = await runtime.workspaceService.setWorkspaceToolEnabled(ctx, toolName, enabled);
            res.status(200).json(result);
        }
        catch (err) {
            deps.sendBridgeError(res, err, { route });
        }
    });
}
//# sourceMappingURL=workspace-tools.js.map