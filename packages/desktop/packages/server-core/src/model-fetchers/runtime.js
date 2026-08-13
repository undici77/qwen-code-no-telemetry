/**
 * Module-level PlatformServices for model fetchers.
 * Avoids circular imports (index.ts → registry.ts → fetchers → index.ts).
 * Must be initialized via setFetcherPlatform() before any model fetching.
 */
import { createScopedLogger, CONSOLE_LOGGER } from '../runtime/platform';
let _platform = null;
// Scoped logger — upgraded from console fallback when setFetcherPlatform() is called.
// ES module live binding: importers of `handlerLog` see the updated value automatically.
export let handlerLog = createScopedLogger(CONSOLE_LOGGER, 'handler');
export function setFetcherPlatform(platform) {
    _platform = platform;
    handlerLog = createScopedLogger(platform.logger, 'handler');
}
export function getHostRuntime() {
    if (!_platform)
        throw new Error('setFetcherPlatform() must be called before model fetching');
    return {
        appRootPath: _platform.appRootPath,
        resourcesPath: _platform.resourcesPath,
        isPackaged: _platform.isPackaged,
    };
}
//# sourceMappingURL=runtime.js.map