export declare function getDaemonBaseUrl(): string;
export declare function getDaemonToken(): string | undefined;
export declare function waitForDaemonTokenMessage(
  timeoutMs?: number,
): Promise<string | undefined>;
export declare function removeDaemonTokenFromUrl(): void;
export declare function getDaemonAuthHeaders(): HeadersInit | undefined;
