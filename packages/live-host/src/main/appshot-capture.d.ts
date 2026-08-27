import { type NativeAppshot, type NativeAppshotCapture } from './native-appshot.ts';
export interface AppshotCapture {
    appName: string;
    windowTitle?: string;
    accessibilityText: string;
    screenshotPath: string;
}
export declare function validateNativeCapture(value: NativeAppshotCapture): Omit<AppshotCapture, 'screenshotPath'> & {
    screenshot: Uint8Array;
};
export declare class AppshotCaptureService {
    private readonly captureDirectory;
    private readonly native;
    private capturing;
    private readonly cleanupTimers;
    constructor(captureDirectory?: string, native?: () => NativeAppshot);
    capture(): Promise<AppshotCapture>;
    dispose(): void;
    private scheduleCleanup;
    private removeStaleCaptures;
}
