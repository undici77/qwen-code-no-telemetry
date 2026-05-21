import type { LoadedSettings } from '../config/settings.js';
export declare function runWithAcpRuntimeOutputDir<T>(settings: LoadedSettings, cwd: string, fn: () => T): T;
