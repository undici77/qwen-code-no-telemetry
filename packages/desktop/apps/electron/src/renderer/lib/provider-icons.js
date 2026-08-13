/**
 * Provider Icons
 *
 * Maps the built-in Qwen backend to display metadata.
 * Used in AI Settings page and anywhere connection logos are needed.
 */
/**
 * Icon URLs for each provider
 */
export const providerIcons = {};
/** Human-readable provider names */
const providerDisplayNames = {
    qwen: 'Qwen Code',
};
/** Get a human-readable provider name from provider type and optional base URL */
export function getProviderDisplayName(providerType, _baseUrl) {
    return providerDisplayNames[providerType] || providerType;
}
/**
 * Get provider icon URL for a given provider type and optional base URL.
 *
 * @param providerType - The LLM provider type
 * @param baseUrl - Ignored for the Qwen-only backend
 * @param authProvider - Ignored for the Qwen-only backend
 * @returns Icon URL string or null if no matching icon
 */
export function getProviderIcon(_providerType, _baseUrl, _authProvider) {
    return null;
}
//# sourceMappingURL=provider-icons.js.map