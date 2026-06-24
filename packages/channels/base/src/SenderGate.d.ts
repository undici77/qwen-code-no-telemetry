import type { SenderPolicy } from './types.js';
import type { PairingStore } from './PairingStore.js';
export interface SenderCheckResult {
    allowed: boolean;
    pairingCode?: string | null;
}
export declare class SenderGate {
    private policy;
    private allowedUsers;
    private pairingStore;
    constructor(policy: SenderPolicy, allowedUsers?: string[], pairingStore?: PairingStore);
    check(senderId: string, senderName?: string): SenderCheckResult;
}
