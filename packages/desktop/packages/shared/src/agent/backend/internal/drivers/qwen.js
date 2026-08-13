import { fetchQwenModelsViaSharedAcp } from '../../../qwen-agent.ts';
export const qwenDriver = {
    provider: 'qwen',
    buildRuntime: ({ resolvedPaths }) => ({
        paths: {
            qwenCli: resolvedPaths.qwenCliPath,
            node: resolvedPaths.nodeRuntimePath,
        },
    }),
    fetchModels: ({ hostRuntime, timeoutMs }) => fetchQwenModelsViaSharedAcp({
        hostRuntime,
        timeoutMs,
    }),
    validateStoredConnection: async () => ({
        success: true,
        shouldRefreshModels: true,
    }),
    testConnection: async () => null,
};
//# sourceMappingURL=qwen.js.map