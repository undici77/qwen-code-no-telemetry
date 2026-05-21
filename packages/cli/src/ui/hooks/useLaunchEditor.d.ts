/**
 * React hook that provides an editor launcher function.
 * Uses settings context and stdin management internally.
 */
export declare function useLaunchEditor(): (filePath: string) => Promise<void>;
