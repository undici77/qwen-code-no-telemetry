import { QwenAgent } from '../qwen-agent.ts';
import { getDefaultLlmConnection, getLlmConnection, } from '../../config/storage.ts';
import { DEFAULT_MODEL } from '../../config/models.ts';
import { resolveBackendHostTooling as resolveHostToolingPaths, resolveBackendRuntimePaths, } from './internal/runtime-resolver.ts';
import { qwenDriver } from './internal/drivers/qwen.ts';
export function detectProvider(_authType) {
    return 'qwen';
}
export function createBackend(config) {
    return new QwenAgent({
        ...config,
        provider: 'qwen',
        providerType: 'qwen',
        authType: 'none',
    });
}
export const createAgent = createBackend;
export function getAvailableProviders() {
    return ['qwen'];
}
export function isProviderAvailable(provider) {
    return provider === 'qwen';
}
export function connectionTypeToProvider(_type) {
    return 'qwen';
}
export function connectionAuthTypeToBackendAuthType(_authType) {
    return 'none';
}
function qwenConnectionFallback() {
    return {
        slug: 'qwen-code',
        name: 'Qwen Code',
        providerType: 'qwen',
        authType: 'none',
        createdAt: 0,
    };
}
export function resolveSessionConnection(sessionConnectionSlug, workspaceDefaultConnectionSlug) {
    const slug = sessionConnectionSlug || workspaceDefaultConnectionSlug || getDefaultLlmConnection();
    if (!slug)
        return qwenConnectionFallback();
    return getLlmConnection(slug) ?? qwenConnectionFallback();
}
export function resolveBackendContext(args) {
    const connection = resolveSessionConnection(args.sessionConnectionSlug, args.workspaceDefaultConnectionSlug);
    return {
        connection,
        provider: 'qwen',
        authType: 'none',
        resolvedModel: resolveModelForProvider('qwen', args.managedModel, connection),
        capabilities: BACKEND_CAPABILITIES.qwen,
    };
}
export function resolveSetupTestConnectionHint() {
    return { providerType: 'qwen' };
}
export async function fetchBackendModels(args) {
    const resolvedPaths = resolveBackendRuntimePaths(args.hostRuntime);
    return qwenDriver.fetchModels({
        connection: { ...args.connection, providerType: 'qwen', authType: 'none' },
        credentials: args.credentials,
        hostRuntime: args.hostRuntime,
        resolvedPaths,
        timeoutMs: args.timeoutMs ?? 30_000,
    });
}
export async function validateStoredBackendConnection(args) {
    const resolvedPaths = resolveBackendRuntimePaths(args.hostRuntime);
    return qwenDriver.validateStoredConnection
        ? qwenDriver.validateStoredConnection({
            slug: args.slug,
            connection: { ...args.connection, providerType: 'qwen', authType: 'none' },
            credentialManager: undefined,
            hostRuntime: args.hostRuntime,
            resolvedPaths,
        })
        : { success: true };
}
export function providerTypeToAgentProvider(_providerType) {
    return 'qwen';
}
export function createConfigFromConnection(connection, baseConfig) {
    const { model: baseModel, ...restConfig } = baseConfig;
    const model = baseModel || connection.defaultModel;
    return {
        ...restConfig,
        provider: 'qwen',
        providerType: 'qwen',
        authType: 'none',
        connectionSlug: connection.slug,
        ...(model ? { model } : {}),
    };
}
export function createBackendFromConnection(connectionSlug, baseConfig, hostRuntime, providerOptions) {
    const connection = getLlmConnection(connectionSlug) ?? qwenConnectionFallback();
    const context = resolveBackendContext({
        sessionConnectionSlug: connection.slug,
        managedModel: baseConfig.model,
    });
    if (hostRuntime) {
        return createBackendFromResolvedContext({
            context,
            coreConfig: baseConfig,
            hostRuntime,
            providerOptions,
        });
    }
    return createBackend(createConfigFromConnection(connection, {
        ...baseConfig,
        ...(context.resolvedModel ? { model: context.resolvedModel } : {}),
    }));
}
export function createBackendFromResolvedContext(args) {
    const resolvedPaths = resolveBackendRuntimePaths(args.hostRuntime);
    const runtime = qwenDriver.buildRuntime({
        context: args.context,
        coreConfig: args.coreConfig,
        hostRuntime: args.hostRuntime,
        resolvedPaths,
        providerOptions: args.providerOptions,
    });
    return createBackend({
        ...args.coreConfig,
        provider: 'qwen',
        providerType: 'qwen',
        authType: 'none',
        ...(args.context.resolvedModel ? { model: args.context.resolvedModel } : {}),
        runtime,
    });
}
export const BACKEND_CAPABILITIES = {
    qwen: { needsHttpPoolServer: true, listsSessions: true },
};
export function resolveModelForProvider(_provider, managedModel, connection) {
    return managedModel || connection?.defaultModel || '';
}
export function getDefaultAuthType(_provider) {
    return 'none';
}
export function initializeBackendHostRuntime(args) {
    qwenDriver.initializeHostRuntime?.({
        hostRuntime: args.hostRuntime,
        resolvedPaths: resolveBackendRuntimePaths(args.hostRuntime),
    });
}
export function resolveBackendHostTooling(hostRuntime) {
    return resolveHostToolingPaths(hostRuntime);
}
export async function cleanupSourceRuntimeArtifacts() {
    // Qwen-only runtime does not create provider-specific source artifacts.
}
export async function testBackendConnection(args) {
    const resolvedPaths = resolveBackendRuntimePaths(args.hostRuntime);
    const result = await qwenDriver.testConnection?.({
        provider: 'qwen',
        apiKey: '',
        model: args.model || DEFAULT_MODEL,
        hostRuntime: args.hostRuntime,
        resolvedPaths,
        timeoutMs: args.timeoutMs ?? 30_000,
        connection: { providerType: 'qwen' },
    });
    return result ?? { success: true };
}
export async function validateConnection(args) {
    if (!args.hostRuntime)
        return { success: true };
    return testBackendConnection({
        provider: 'qwen',
        apiKey: '',
        model: args.model || DEFAULT_MODEL,
        hostRuntime: args.hostRuntime,
    });
}
//# sourceMappingURL=factory.js.map