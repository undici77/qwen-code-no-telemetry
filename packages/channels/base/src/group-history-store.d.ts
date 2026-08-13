export interface GroupHistoryEntry {
    senderId: string;
    senderName: string;
    text: string;
    messageId?: string;
    timestamp: number;
}
export interface GroupHistoryStoreOptions {
    maxKeys?: number;
    compactAfterRecords?: number;
}
export declare class GroupHistoryStore {
    private readonly filePath;
    private maxKeys;
    private compactAfterRecords;
    constructor(filePath: string, options?: GroupHistoryStoreOptions);
    record(key: string, entry: GroupHistoryEntry, limit: number): void;
    drain(key: string, limit: number): GroupHistoryEntry[];
    clear(key: string): void;
    clearAll(): void;
    size(key?: string): number;
    private loadState;
    private readRecords;
    private append;
    private compact;
}
