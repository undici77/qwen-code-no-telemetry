import type { ElectronAPI } from '../../../shared/types';
export type BrowserPaneApi = ElectronAPI['browserPane'];
export interface OpenUrlInBuiltInBrowserOptions {
    /** Browser pane API surface (window.electronAPI.browserPane). */
    browserPaneApi?: BrowserPaneApi;
    /** Channel availability probe (window.electronAPI.isChannelAvailable). */
    isChannelAvailable?: (channel: string) => boolean;
    /** Opens the URL in the system default browser. */
    openExternal: (url: string) => void;
}
/**
 * Open a URL in the docked built-in browser, falling back to the system
 * default browser on any failure so link clicks never no-op silently
 * (https://github.com/QwenLM/qwen-code/issues/8593).
 */
export declare function openUrlInBuiltInBrowser(url: string, { browserPaneApi, isChannelAvailable, openExternal }: OpenUrlInBuiltInBrowserOptions): Promise<void>;
