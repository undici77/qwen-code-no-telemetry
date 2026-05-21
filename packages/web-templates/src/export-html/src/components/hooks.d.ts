import type { PlatformContextValue } from './types.js';
/**
 * Hook to provide platform context for the export HTML viewer
 */
export declare const usePlatformContext: () => {
    platformContext: {
        platform: PlatformContextValue["platform"];
        postMessage: (message: unknown) => void;
        onMessage: (handler: (event: MessageEvent) => void) => () => void;
        openFile: (path: string) => void;
        openTempFile: (content: string, fileName?: string) => void;
        getResourceUrl: () => undefined;
        features: {
            canOpenFile: false;
            canOpenTempFile: true;
            canCopy: true;
        };
    };
    modalState: import("./TempFileModal.js").ModalState;
    closeModal: () => void;
};
