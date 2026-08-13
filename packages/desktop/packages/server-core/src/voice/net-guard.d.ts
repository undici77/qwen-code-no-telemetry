/**
 * SSRF guard for the resolved voice baseUrl. Voice audio must never be sent in
 * cleartext or to a private-network address, so the configured ASR endpoint is
 * required to be https (or loopback) and is checked against private IP ranges —
 * including a DNS resolution so a public hostname can't point at an internal IP.
 *
 * Twin of the CLI voice network guard in
 * packages/cli/src/services/voice-transcriber.ts. The bun workspace boundary
 * prevents sharing a module; keep the address classification and messages in
 * the two files in sync.
 */
export type VoiceHostLookup = (hostname: string) => Promise<{
    address: string;
} | Array<{
    address: string;
}>>;
export declare function isLoopbackHost(hostname: string): boolean;
/** IP-literal private-network check; hostname resolution is handled separately. */
export declare function isPrivateNetworkIp(hostname: string): boolean;
export declare function isAlwaysBlockedVoiceAddress(address: string): boolean;
export declare function isLoopbackVoiceAddress(address: string): boolean;
export interface VoiceNetworkGuardTarget {
    baseUrl: string;
    model: string;
    allowInsecureBaseUrl?: boolean;
}
/** Reject a voice baseUrl that resolves to a private-network address. */
export declare function assertVoiceBaseUrlNetworkAllowed(voiceConfig: VoiceNetworkGuardTarget, lookupHost?: VoiceHostLookup): Promise<void>;
