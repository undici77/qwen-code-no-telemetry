import type { PermissionState } from '../shared/protocol.ts';
import { type NativeAppshot } from './native-appshot.ts';
export type AppshotReadiness = {
    accessibility: PermissionState;
    screenRecording: PermissionState;
    appshot: boolean;
};
export declare class AppshotReadinessMonitor {
    private readonly onState;
    private readonly native;
    private started;
    private lastState;
    constructor(onState: (state: AppshotReadiness) => void, native?: () => NativeAppshot);
    start(): void;
    stop(): void;
    requestPermission(kind: 'accessibility' | 'screenRecording'): void;
    refresh(): void;
}
