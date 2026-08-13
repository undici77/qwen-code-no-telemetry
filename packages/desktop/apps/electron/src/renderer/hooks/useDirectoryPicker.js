import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
import { useTransportConnectionState } from './useTransportConnectionState';
import { toast } from 'sonner';
export function useDirectoryPicker(onSelect) {
    const { t } = useTranslation();
    const connectionState = useTransportConnectionState();
    const isRemote = connectionState?.mode === 'remote';
    const canBrowse = isRemote &&
        window.electronAPI.isChannelAvailable(RPC_CHANNELS.fs.LIST_DIRECTORY);
    const [showServerBrowser, setShowServerBrowser] = useState(false);
    const serverBrowserMode = canBrowse ? 'browse' : 'manual';
    const pickDirectory = useCallback(async () => {
        if (isRemote) {
            // Remote mode — open ServerDirectoryBrowser (browse or manual depending on server support)
            setShowServerBrowser(true);
            return;
        }
        // Local mode — native OS dialog
        try {
            const path = await window.electronAPI.openFolderDialog();
            if (path)
                onSelect(path);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(t('toast.failedToOpenFolderPicker'), {
                description: message,
            });
        }
    }, [isRemote, onSelect]);
    const cancelServerBrowser = useCallback(() => {
        setShowServerBrowser(false);
    }, []);
    const confirmServerBrowser = useCallback((path) => {
        setShowServerBrowser(false);
        onSelect(path);
    }, [onSelect]);
    return {
        pickDirectory,
        showServerBrowser,
        serverBrowserMode,
        cancelServerBrowser,
        confirmServerBrowser,
        isRemote,
    };
}
//# sourceMappingURL=useDirectoryPicker.js.map