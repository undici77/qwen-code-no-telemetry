// Version is read from package.json — the single source of truth.
// All build scripts, CI workflows, and runtime code use this value.
import pkg from '../../package.json';
export const APP_VERSION = pkg.version;
export function getAppVersion() {
    return APP_VERSION;
}
export * from './install.ts';
export * from './manifest.ts';
export * from './version.ts';
//# sourceMappingURL=index.js.map