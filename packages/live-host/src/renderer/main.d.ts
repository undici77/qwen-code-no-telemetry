import type { LiveHostApi } from '../shared/host-api.ts';
declare global {
    interface Window {
        qwenLiveHost: LiveHostApi;
    }
}
