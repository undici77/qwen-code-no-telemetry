import { loadNativeAppshot } from './native-appshot.ts';
const EMPTY_READINESS = {
    accessibility: 'not_determined',
    screenRecording: 'not_determined',
    appshot: false,
};
function permission(value) {
    return value ? 'granted' : 'denied';
}
export class AppshotReadinessMonitor {
    onState;
    native;
    started = false;
    lastState = '';
    constructor(onState, native = loadNativeAppshot) {
        this.onState = onState;
        this.native = native;
    }
    start() {
        if (this.started)
            return;
        this.started = true;
        this.refresh();
    }
    stop() {
        this.started = false;
        this.lastState = '';
    }
    requestPermission(kind) {
        if (!this.started)
            return;
        try {
            const native = this.native();
            if (kind === 'accessibility')
                native.requestAccessibility();
            else
                native.requestScreenRecording();
        }
        catch { }
        this.refresh();
    }
    refresh() {
        if (!this.started)
            return;
        let state = EMPTY_READINESS;
        try {
            const permissions = this.native().getPermissionState();
            state = {
                accessibility: permission(permissions.accessibility),
                screenRecording: permission(permissions.screenRecording),
                appshot: permissions.accessibility && permissions.screenRecording,
            };
        }
        catch {
            state = EMPTY_READINESS;
        }
        const serialized = JSON.stringify(state);
        if (serialized === this.lastState)
            return;
        this.lastState = serialized;
        this.onState({ ...state });
    }
}
//# sourceMappingURL=appshot-readiness.js.map