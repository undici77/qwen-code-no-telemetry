import type { LiveStatus } from '../shared/protocol.ts';
export declare function isActiveLiveCall(status: Pick<LiveStatus, 'state'>): boolean;
export declare function canToggleLive(status: Pick<LiveStatus, 'available' | 'state'>, connectionReady: boolean, hostReady: boolean): boolean;
export declare function shouldCaptureLiveAudio(status: Pick<LiveStatus, 'available' | 'state'>, hostReady: boolean): boolean;
export declare function shouldStopLiveOnToggle(status: Pick<LiveStatus, 'state'>, startPending: boolean): boolean;
export declare function projectLiveStatusForCapture(status: LiveStatus, captureReady: boolean): LiveStatus;
export declare function shouldRenderSetup(status: Pick<LiveStatus, 'available' | 'state'>, connectionReady: boolean): boolean;
