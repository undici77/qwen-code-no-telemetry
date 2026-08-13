import type { SenderPolicy } from './types.js';
import type { CreatePairingRequestResult, PairingStore } from './PairingStore.js';
export interface SenderCheckResult {
    allowed: boolean;
    /** Set when the pairing policy denies the sender. */
    pairing?: CreatePairingRequestResult;
}
export declare class SenderGate {
    private policy;
    private allowedUsers;
    private pairingStore;
    constructor(policy: SenderPolicy, allowedUsers?: string[], pairingStore?: PairingStore);
    replaceAllowedUsers(users: string[]): void;
    isAllowed(senderId: string): boolean;
    check(senderId: string, senderName?: string): SenderCheckResult;
}
