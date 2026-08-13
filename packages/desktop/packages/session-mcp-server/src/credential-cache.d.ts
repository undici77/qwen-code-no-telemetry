/**
 * Get the path to a source's credential cache file.
 * The main process writes decrypted credentials to these files.
 */
export declare function getCredentialCachePath(workspaceRootPath: string, sourceSlug: string): string;
/**
 * Read credentials from the cache file for a source.
 * Returns null if the cache doesn't exist, the slug is invalid, or the cache is expired.
 */
export declare function readCredentialCache(workspaceRootPath: string, sourceSlug: string): string | null;
