/**
 * Merges multiple PATH-like environment variable values into a single
 * deduplicated string, preserving the original order and removing duplicates.
 *
 * @param env - The environment object containing PATH-like keys
 * @param pathKeys - Ordered list of keys whose values should be merged
 * @returns The merged PATH string, or undefined if no entries were found
 */
export declare function mergeWindowsPathValues(env: NodeJS.ProcessEnv, pathKeys: string[]): string | undefined;
/**
 * Normalizes PATH-like environment variables on Windows by merging all
 * case-variant keys (PATH, Path, path, etc.) into a single canonical `PATH`
 * key with deduplicated entries. On non-Windows platforms this is a no-op.
 *
 * Results are cached by fingerprint to avoid redundant merges when the
 * environment has not changed between calls.
 *
 * @param env - The environment object to normalize
 * @returns A new environment object with a single canonical `PATH` key
 */
export declare function normalizePathEnvForWindows(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
