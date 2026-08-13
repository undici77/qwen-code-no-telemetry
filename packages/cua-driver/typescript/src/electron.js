import { openMacOsScreenRecordingSettings as openGeneratedSettings, requestMacOsPermissions as requestGeneratedPermissions, } from './native/index.js';
/** Call after Electron's app.whenReady(), from the Electron main process. */
export const requestMacOSPermissions = () => {
    return requestGeneratedPermissions();
};
export const hasRequiredMacOSPermissions = (status) => status.accessibility && status.screenRecording;
export const openMacOSScreenRecordingSettings = async () => openGeneratedSettings();
//# sourceMappingURL=electron.js.map