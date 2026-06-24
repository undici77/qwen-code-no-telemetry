export interface PairingRequest {
    senderId: string;
    senderName: string;
    code: string;
    createdAt: number;
}
export declare class PairingStore {
    private dir;
    private pendingPath;
    private allowlistPath;
    constructor(channelName: string);
    isApproved(senderId: string): boolean;
    /**
     * Create a pairing request for an unknown sender.
     * Returns the code if created, or null if the pending cap is reached.
     * If the sender already has a non-expired pending request, returns that code.
     */
    createRequest(senderId: string, senderName: string): string | null;
    /**
     * Approve a pairing request by code.
     * Returns the sender ID if found, or null if not found / expired.
     */
    approve(code: string): PairingRequest | null;
    listPending(): PairingRequest[];
    getAllowlist(): string[];
    private ensureDir;
    private readPending;
    private writePending;
    private readAllowlist;
    private writeAllowlist;
}
