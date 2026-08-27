export type NativeAppshotPermissions = {
    accessibility: boolean;
    screenRecording: boolean;
};
export type NativeAppshotCapture = {
    appName: string;
    bundleIdentifier?: string;
    windowTitle?: string;
    windowId: number;
    accessibilityText: string;
    screenshot: Uint8Array;
};
export type NativeAppshot = {
    getPermissionState: () => NativeAppshotPermissions;
    requestAccessibility: () => boolean;
    requestScreenRecording: () => boolean;
    captureAppshot: () => Promise<NativeAppshotCapture>;
};
export declare function loadNativeAppshot(): NativeAppshot;
