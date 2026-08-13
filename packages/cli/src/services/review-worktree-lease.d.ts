export declare function clearReviewWorktreeLease(repositoryRoot: string, target: string): void;
export declare function createReviewWorktreeLease(params: {
    sessionId: string | undefined;
    promptId: string | undefined;
    target: string;
    repositoryRoot: string;
    worktreePath: string;
    branch: string;
}): void;
export declare function cleanupReviewWorktreeLeases(params: {
    sessionId: string;
    promptId: string;
    repositoryRoot: string;
    gitTimeout?: number;
}): void;
