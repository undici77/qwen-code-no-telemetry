import { useModalState } from './TempFileModal.js';
const React = window.React;
/**
 * Hook to provide platform context for the export HTML viewer
 */
export const usePlatformContext = () => {
    const { modalState, openModal, closeModal } = useModalState();
    const platformContext = React.useMemo(() => ({
        platform: 'web',
        postMessage: (message) => {
            console.log('Posted message:', message);
        },
        onMessage: (handler) => {
            window.addEventListener('message', handler);
            return () => window.removeEventListener('message', handler);
        },
        openFile: (path) => {
            console.log('Opening file:', path);
        },
        openTempFile: openModal,
        getResourceUrl: () => undefined,
        features: {
            canOpenFile: false,
            canOpenTempFile: true,
            canCopy: true,
        },
    }), [openModal]);
    return { platformContext, modalState, closeModal };
};
//# sourceMappingURL=hooks.js.map