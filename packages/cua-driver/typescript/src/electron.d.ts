import { type MacOsPermissionStatus } from './native/index.js';
/** Compatibility spelling retained for the Electron-specific entry point. */
export type MacOSPermissionStatus = MacOsPermissionStatus;
/** Call after Electron's app.whenReady(), from the Electron main process. */
export declare const requestMacOSPermissions: () => MacOSPermissionStatus;
export declare const hasRequiredMacOSPermissions: (status: MacOSPermissionStatus) => boolean;
export declare const openMacOSScreenRecordingSettings: () => Promise<void>;
