export declare class AbortError extends Error {
    constructor(message?: string);
}
export declare function isAbortError(error: unknown): error is AbortError;
