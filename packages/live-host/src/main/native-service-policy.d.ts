import type { ConnectionPhase } from './daemon-connection.ts';
export declare function shouldActivateNativeServices(phase: ConnectionPhase): boolean;
export declare function shouldDeactivateNativeServices(phase: ConnectionPhase): boolean;
