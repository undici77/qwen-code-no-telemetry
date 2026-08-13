import type { Page } from '@playwright/test';
export interface SseConnectionRecord {
    url: string;
    sessionId: string;
    headers: Record<string, string>;
    connectedAt: number;
}
export interface SseTransport<TEvent> {
    waitForConnection(sessionId?: string, options?: {
        timeout?: number;
    }): Promise<SseConnectionRecord>;
    connections(): Promise<SseConnectionRecord[]>;
    send(event: TEvent): Promise<void>;
    burst(events: readonly TEvent[]): Promise<void>;
    split(event: TEvent, chunkSizes?: readonly number[]): Promise<void>;
    close(): Promise<void>;
    error(message?: string): Promise<void>;
}
interface BrowserSseHarness {
    connections: SseConnectionRecord[];
    writeFrame: (frame: string) => void;
    writeSplitFrame: (frame: string, chunkSizes: readonly number[]) => void;
    close: () => void;
    error: (message: string) => void;
}
declare global {
    interface Window {
        __webShellSseHarness?: BrowserSseHarness;
    }
}
export declare function installSseTransport<TEvent>(page: Page, options: {
    baseURL: string;
}): Promise<SseTransport<TEvent>>;
export {};
