/**
 * Provider metadata for user-facing error messages and recovery actions.
 * Maps provider identifiers to their status pages and dashboards.
 */
/**
 * Metadata for the Qwen backend.
 */
const PROVIDER_METADATA = {
    qwen: {
        name: 'Qwen Code',
        dashboardUrl: 'https://chat.qwen.ai',
    },
};
/**
 * Look up provider metadata by provider type.
 */
export function getProviderMetadata(providerType) {
    if (providerType === 'qwen') {
        return PROVIDER_METADATA.qwen;
    }
    return undefined;
}
/**
 * Get just the display name for a provider, with a fallback.
 */
export function getProviderDisplayName(providerType) {
    return getProviderMetadata(providerType)?.name ?? 'AI provider';
}
//# sourceMappingURL=provider-metadata.js.map