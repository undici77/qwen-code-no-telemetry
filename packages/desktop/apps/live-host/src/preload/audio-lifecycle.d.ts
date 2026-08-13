export declare class HostAudioLifecycle {
    private queue;
    private generation;
    activate(operation: () => Promise<void>): Promise<void>;
    runIfCurrent(operation: () => Promise<void>): Promise<void>;
    deactivate(deactivateNow: () => void, cleanup: () => Promise<void>): Promise<void>;
    private enqueue;
}
