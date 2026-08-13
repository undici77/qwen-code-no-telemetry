import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PairingCodeDialogPreview
 *
 * Renders the real PairingCodeDialog with `open` wired to local state so the
 * user can dismiss it (ESC / outside click / close button) just like in the
 * real app. The dialog auto-reopens whenever any display prop changes so that
 * switching variants in the playground sidebar brings it back without needing
 * a separate "reopen" button. Computes `expiresAt` from an
 * `expiresInSeconds` prop so the variant sidebar can show "Expired" (0) or
 * a specific countdown state.
 */
import * as React from 'react';
import { PairingCodeDialog } from '../../../components/messaging/PairingCodeDialog';
export function PairingCodeDialogPreview({ platform, code, expiresInSeconds, botUsername, error, }) {
    const [open, setOpen] = React.useState(true);
    // Reopen on any prop change so switching variants in the sidebar brings
    // the dialog back up after the user has dismissed it.
    React.useEffect(() => {
        setOpen(true);
    }, [platform, code, expiresInSeconds, botUsername, error]);
    // Recompute expiresAt when the countdown prop changes so the timer restarts.
    const expiresAt = React.useMemo(() => {
        if (expiresInSeconds < 0)
            return null;
        return Date.now() + expiresInSeconds * 1000;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiresInSeconds]);
    return (_jsxs(_Fragment, { children: [_jsx(PairingCodeDialog, { open: open, onOpenChange: setOpen, platform: platform, code: code || null, expiresAt: expiresAt, botUsername: botUsername || undefined, error: error || undefined }), !open && (_jsxs("div", { className: "p-6 text-sm text-foreground/60", children: ["Dialog dismissed.", ' ', _jsx("button", { type: "button", className: "underline hover:text-foreground", onClick: () => setOpen(true), children: "Reopen" })] }))] }));
}
//# sourceMappingURL=PairingCodeDialogPreview.js.map