import { RPC_CHANNELS, } from '@craft-agent/shared/protocol';
import { QWEN_CODE_CONNECTION_SLUG, addLlmConnection, deleteLlmConnection, getDefaultLlmConnection, getLlmConnection, getLlmConnections, getWorkspaceByNameOrId, setDefaultLlmConnection, touchLlmConnection, updateLlmConnection, } from '@craft-agent/shared/config';
import { BRAND } from '@craft-agent/shared/branding';
import { getCredentialManager } from '@craft-agent/shared/credentials';
import { setSetupDeferred } from '@craft-agent/shared/config/storage';
import { testBackendConnection, validateStoredBackendConnection, } from '@craft-agent/shared/agent/backend';
import { connectQwenProviderViaAcp, listQwenProvidersViaAcp, } from '@craft-agent/shared/agent';
import { getModelRefreshService } from '@craft-agent/server-core/model-fetchers';
import { createBuiltInConnection, parseTestConnectionError, } from '@craft-agent/server-core/domain';
import { getWorkspaceOrThrow, buildBackendHostRuntimeContext, } from '@craft-agent/server-core/handlers';
function attachRuntimeModelState(connection) {
    let runtimeState;
    try {
        runtimeState = getModelRefreshService().getRuntimeModelState(connection.slug);
    }
    catch {
        runtimeState = undefined;
    }
    if (!runtimeState ||
        (runtimeState.models.length === 0 && !runtimeState.serverDefault)) {
        return connection;
    }
    return {
        ...connection,
        models: runtimeState.models,
        defaultModel: runtimeState.serverDefault,
    };
}
export const HANDLED_CHANNELS = [
    RPC_CHANNELS.llmConnections.LIST,
    RPC_CHANNELS.llmConnections.LIST_WITH_STATUS,
    RPC_CHANNELS.llmConnections.GET,
    RPC_CHANNELS.llmConnections.GET_API_KEY,
    RPC_CHANNELS.llmConnections.SAVE,
    RPC_CHANNELS.llmConnections.DELETE,
    RPC_CHANNELS.llmConnections.TEST,
    RPC_CHANNELS.llmConnections.SET_DEFAULT,
    RPC_CHANNELS.llmConnections.SET_WORKSPACE_DEFAULT,
    RPC_CHANNELS.llmConnections.REFRESH_MODELS,
    RPC_CHANNELS.settings.SETUP_LLM_CONNECTION,
    RPC_CHANNELS.settings.TEST_LLM_CONNECTION_SETUP,
    RPC_CHANNELS.settings.LIST_QWEN_PROVIDERS,
    RPC_CHANNELS.settings.CONNECT_QWEN_PROVIDER,
];
function ensureQwenConnection(slug = QWEN_CODE_CONNECTION_SLUG) {
    return (getLlmConnection(slug) ?? createBuiltInConnection(QWEN_CODE_CONNECTION_SLUG));
}
async function getQwenWorkspaceAcpOptions(deps, ctx) {
    const workspaceId = ctx.workspaceId ??
        (ctx.webContentsId
            ? deps.windowManager?.getWorkspaceForWindow(ctx.webContentsId)
            : undefined);
    const workspace = workspaceId ? getWorkspaceByNameOrId(workspaceId) : null;
    const { loadWorkspaceConfig } = await import('@craft-agent/shared/workspaces');
    const workspaceConfig = workspace
        ? loadWorkspaceConfig(workspace.rootPath)
        : null;
    const projectRoot = workspace?.rootPath;
    const cwd = workspaceConfig?.defaults?.workingDirectory || projectRoot;
    return {
        hostRuntime: buildBackendHostRuntimeContext(deps.platform),
        ...(cwd ? { cwd } : {}),
        ...(projectRoot ? { processCwd: projectRoot } : {}),
    };
}
export function registerLlmConnectionsHandlers(server, deps) {
    const { sessionManager } = deps;
    server.handle(RPC_CHANNELS.settings.LIST_QWEN_PROVIDERS, async (ctx) => listQwenProvidersViaAcp(await getQwenWorkspaceAcpOptions(deps, ctx)));
    server.handle(RPC_CHANNELS.settings.CONNECT_QWEN_PROVIDER, async (ctx, params, _sessionId) => {
        try {
            const scopedParams = {
                ...params,
                scope: 'user',
            };
            const result = await connectQwenProviderViaAcp(await getQwenWorkspaceAcpOptions(deps, ctx), scopedParams);
            if (!result.success)
                return result;
            const existing = ensureQwenConnection();
            const qwenConnection = {
                ...existing,
                slug: QWEN_CODE_CONNECTION_SLUG,
                name: BRAND.selfReferName,
                providerType: 'qwen',
                authType: 'none',
                defaultModel: result.modelId || existing.defaultModel,
            };
            if (getLlmConnection(qwenConnection.slug)) {
                updateLlmConnection(qwenConnection.slug, qwenConnection);
            }
            else {
                addLlmConnection(qwenConnection);
            }
            setDefaultLlmConnection(qwenConnection.slug);
            try {
                await getModelRefreshService().refreshNow(qwenConnection.slug);
            }
            catch (err) {
                deps.platform.logger?.warn(`Qwen model refresh after provider connect failed: ${err instanceof Error ? err.message : err}`);
            }
            await sessionManager.reinitializeAuth(qwenConnection.slug);
            setSetupDeferred(false);
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            deps.platform.logger?.error('Failed to connect Qwen provider:', message);
            return { success: false, error: message };
        }
    });
    server.handle(RPC_CHANNELS.settings.SETUP_LLM_CONNECTION, async (_ctx, setup) => {
        try {
            const connection = ensureQwenConnection(setup.slug);
            const qwenConnection = {
                ...connection,
                slug: QWEN_CODE_CONNECTION_SLUG,
                name: BRAND.selfReferName,
                providerType: 'qwen',
                authType: 'none',
            };
            if (getLlmConnection(qwenConnection.slug)) {
                updateLlmConnection(qwenConnection.slug, qwenConnection);
            }
            else {
                addLlmConnection(qwenConnection);
            }
            setDefaultLlmConnection(qwenConnection.slug);
            try {
                await getModelRefreshService().refreshNow(qwenConnection.slug);
            }
            catch (err) {
                deps.platform.logger?.warn(`Qwen model refresh after setup failed: ${err instanceof Error ? err.message : err}`);
            }
            await sessionManager.reinitializeAuth(qwenConnection.slug);
            setSetupDeferred(false);
            return { success: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            deps.platform.logger?.error('Failed to setup Qwen connection:', message);
            return { success: false, error: message };
        }
    });
    server.handle(RPC_CHANNELS.settings.TEST_LLM_CONNECTION_SETUP, async (_ctx, params) => {
        const startedAt = Date.now();
        try {
            const result = await testBackendConnection({
                provider: 'qwen',
                apiKey: '',
                model: params.model || 'qwen3-coder',
                timeoutMs: 45000,
                hostRuntime: buildBackendHostRuntimeContext(deps.platform),
                connection: { providerType: 'qwen' },
            });
            const elapsed = Date.now() - startedAt;
            deps.platform.logger?.info(`[testQwenConnectionSetup] Elapsed: ${elapsed}ms, success=${result.success}`);
            return result.success
                ? { success: true }
                : {
                    success: false,
                    error: parseTestConnectionError(result.error || 'Unknown error'),
                };
        }
        catch (error) {
            const elapsed = Date.now() - startedAt;
            const msg = error instanceof Error ? error.message : String(error);
            deps.platform.logger?.info(`[testQwenConnectionSetup] Elapsed: ${elapsed}ms, threw: ${msg.slice(0, 1000)}`);
            return { success: false, error: parseTestConnectionError(msg) };
        }
    });
    server.handle(RPC_CHANNELS.llmConnections.LIST, async () => getLlmConnections().map(attachRuntimeModelState));
    server.handle(RPC_CHANNELS.llmConnections.LIST_WITH_STATUS, async () => {
        const defaultSlug = getDefaultLlmConnection();
        return getLlmConnections().map((conn) => attachRuntimeModelState({
            ...conn,
            isAuthenticated: true,
            isDefault: conn.slug === defaultSlug,
        }));
    });
    server.handle(RPC_CHANNELS.llmConnections.GET, async (_ctx, slug) => {
        const connection = getLlmConnection(slug);
        return connection ? attachRuntimeModelState(connection) : null;
    });
    server.handle(RPC_CHANNELS.llmConnections.GET_API_KEY, async () => null);
    server.handle(RPC_CHANNELS.llmConnections.SAVE, async (_ctx, connection) => {
        try {
            const qwenConnection = {
                ...connection,
                slug: connection.slug || QWEN_CODE_CONNECTION_SLUG,
                name: connection.name || BRAND.selfReferName,
                providerType: 'qwen',
                authType: 'none',
            };
            const existing = getLlmConnection(qwenConnection.slug);
            const success = existing
                ? updateLlmConnection(qwenConnection.slug, qwenConnection)
                : addLlmConnection(qwenConnection);
            if (!success)
                return { success: false, error: 'Failed to save connection' };
            if (!getDefaultLlmConnection())
                setDefaultLlmConnection(qwenConnection.slug);
            await sessionManager.reinitializeAuth(qwenConnection.slug);
            return { success: true };
        }
        catch (error) {
            deps.platform.logger?.error('Failed to save Qwen connection:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
    server.handle(RPC_CHANNELS.llmConnections.DELETE, async (_ctx, slug) => {
        try {
            const success = deleteLlmConnection(slug);
            if (success) {
                getModelRefreshService().stopConnection(slug);
                await getCredentialManager().deleteLlmCredentials(slug);
            }
            return { success };
        }
        catch (error) {
            deps.platform.logger?.error('Failed to delete Qwen connection:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
    server.handle(RPC_CHANNELS.llmConnections.TEST, async (_ctx, slug) => {
        try {
            const connection = getLlmConnection(slug);
            if (!connection)
                return { success: false, error: 'Connection not found' };
            const result = await validateStoredBackendConnection({
                slug,
                connection,
                hostRuntime: buildBackendHostRuntimeContext(deps.platform),
            });
            if (!result.success)
                return { success: false, error: result.error };
            touchLlmConnection(slug);
            if (result.shouldRefreshModels) {
                getModelRefreshService()
                    .refreshNow(slug)
                    .catch((err) => {
                    deps.platform.logger?.warn(`Qwen model refresh failed during validation: ${err instanceof Error ? err.message : err}`);
                });
            }
            return { success: true };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return { success: false, error: parseTestConnectionError(msg) };
        }
    });
    server.handle(RPC_CHANNELS.llmConnections.SET_DEFAULT, async (_ctx, slug) => {
        const success = setDefaultLlmConnection(slug);
        if (success)
            await sessionManager.reinitializeAuth(slug);
        return { success, error: success ? undefined : 'Connection not found' };
    });
    server.handle(RPC_CHANNELS.llmConnections.SET_WORKSPACE_DEFAULT, async (_ctx, workspaceId, slug) => {
        try {
            const workspace = getWorkspaceOrThrow(workspaceId);
            if (slug && !getLlmConnection(slug))
                return { success: false, error: 'Connection not found' };
            const { loadWorkspaceConfig, saveWorkspaceConfig } = await import('@craft-agent/shared/workspaces');
            const config = loadWorkspaceConfig(workspace.rootPath);
            if (!config)
                return { success: false, error: 'Failed to load workspace config' };
            config.defaults = config.defaults || {};
            if (slug)
                config.defaults.defaultLlmConnection = slug;
            else
                delete config.defaults.defaultLlmConnection;
            saveWorkspaceConfig(workspace.rootPath, config);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
    server.handle(RPC_CHANNELS.llmConnections.REFRESH_MODELS, async (_ctx, slug) => {
        try {
            if (!getLlmConnection(slug))
                return { success: false, error: 'Connection not found' };
            await getModelRefreshService().refreshNow(slug);
            return { success: true };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            deps.platform.logger?.error(`Failed to refresh Qwen models for ${slug}: ${msg}`);
            return { success: false, error: msg };
        }
    });
}
//# sourceMappingURL=llm-connections.js.map