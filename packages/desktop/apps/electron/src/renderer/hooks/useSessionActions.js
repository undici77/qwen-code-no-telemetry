import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
export function useSessionActions({ onFlag, onUnflag, onArchive, onUnarchive, onDelete, }) {
    const { t } = useTranslation();
    const handleFlagWithToast = useCallback((sessionId) => {
        if (!onFlag)
            return;
        onFlag(sessionId);
        toast(t('toast.sessionFlagged'), {
            description: t('toast.sessionFlaggedDesc'),
            action: onUnflag ? {
                label: t('toast.undo'),
                onClick: () => onUnflag(sessionId),
            } : undefined,
        });
    }, [onFlag, onUnflag, t]);
    const handleUnflagWithToast = useCallback((sessionId) => {
        if (!onUnflag)
            return;
        onUnflag(sessionId);
        toast(t('toast.sessionFlagRemoved'), {
            description: t('toast.sessionFlagRemovedDesc'),
            action: onFlag ? {
                label: t('toast.undo'),
                onClick: () => onFlag(sessionId),
            } : undefined,
        });
    }, [onFlag, onUnflag, t]);
    const handleArchiveWithToast = useCallback((sessionId) => {
        if (!onArchive)
            return;
        onArchive(sessionId);
        toast(t('toast.sessionArchived'), {
            description: t('toast.sessionArchivedDesc'),
            action: onUnarchive ? {
                label: t('toast.undo'),
                onClick: () => onUnarchive(sessionId),
            } : undefined,
        });
    }, [onArchive, onUnarchive, t]);
    const handleUnarchiveWithToast = useCallback((sessionId) => {
        if (!onUnarchive)
            return;
        onUnarchive(sessionId);
        toast(t('toast.sessionRestored'), {
            description: t('toast.sessionRestoredDesc'),
            action: onArchive ? {
                label: t('toast.undo'),
                onClick: () => onArchive(sessionId),
            } : undefined,
        });
    }, [onArchive, onUnarchive, t]);
    const handleDeleteWithToast = useCallback(async (sessionId, skipConfirmation = false, displayTitle) => {
        // Confirmation dialog is shown by handleDeleteSession in App.tsx
        // We await so toast only shows after successful deletion (if user confirmed)
        const deleted = await onDelete(sessionId, skipConfirmation, displayTitle);
        if (deleted) {
            toast(t('toast.sessionDeleted'));
        }
        return deleted;
    }, [onDelete, t]);
    return {
        handleFlagWithToast,
        handleUnflagWithToast,
        handleArchiveWithToast,
        handleUnarchiveWithToast,
        handleDeleteWithToast,
    };
}
//# sourceMappingURL=useSessionActions.js.map