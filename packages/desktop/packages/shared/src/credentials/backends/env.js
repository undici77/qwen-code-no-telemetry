/**
 * Environment Variable Backend (DISABLED)
 *
 * This backend is currently disabled to force manual API key entry.
 * Kept as a placeholder for potential future use.
 */
export class EnvironmentBackend {
    name = 'environment';
    priority = 110; // Higher than file (100) so env vars override file storage
    async isAvailable() {
        // Disabled by user request to force manual API keys
        return false;
    }
    async get(_id) {
        return null;
    }
    async set(_id, _credential) {
        throw new Error('Environment backend is disabled');
    }
    async delete(_id) {
        return false;
    }
    async list(_filter) {
        return [];
    }
}
//# sourceMappingURL=env.js.map