export type OverlayFailureReason = 'renderer_process_gone' | 'renderer_unresponsive' | 'preload_failed' | 'renderer_load_failed';
export type OverlayRecoveryScheduler = (callback: () => void, delayMs: number) => () => void;
export declare function isRecoverableOverlayLoadFailure(errorCode: number, isMainFrame: boolean): boolean;
export declare class OverlayRecoveryController {
    private readonly onFailure;
    private readonly onRecover;
    private readonly scheduler;
    private cancelRecovery;
    private stopped;
    constructor(onFailure: (reason: OverlayFailureReason) => void, onRecover: () => void, scheduler?: OverlayRecoveryScheduler);
    handleFailure(reason: OverlayFailureReason): void;
    markReady(): void;
    stop(): void;
    private cancelScheduledRecovery;
}
