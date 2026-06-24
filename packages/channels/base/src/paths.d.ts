/**
 * Expands tilde and resolves relative paths to absolute.
 * Mirrors Storage.resolvePath() in packages/core.
 */
export declare function resolvePath(dir: string): string;
/**
 * Returns the global Qwen home directory (config, credentials, etc.).
 *
 * Priority: QWEN_HOME env var > ~/.qwen
 *
 * This mirrors packages/core Storage.getGlobalQwenDir() without importing
 * from core to avoid cross-package dependencies.
 */
export declare function getGlobalQwenDir(): string;
