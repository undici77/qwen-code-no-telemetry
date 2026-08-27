export type GlobalShortcutBackend = {
    register: (accelerator: string, callback: () => void) => boolean;
    unregister: (accelerator: string) => void;
};
export type GlobalShortcutState = {
    accelerator?: string;
    healthy: boolean;
    error?: string;
};
export declare class LiveGlobalShortcut {
    private readonly backend;
    private readonly onToggle;
    private readonly onState;
    private accelerator;
    private healthy;
    constructor(backend: GlobalShortcutBackend, onToggle: () => void, onState: (state: GlobalShortcutState) => void);
    replace(accelerator: string): GlobalShortcutState;
    stop(): void;
    private unregisterCurrent;
    private unregister;
    private publish;
}
