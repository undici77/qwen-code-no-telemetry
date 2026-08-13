import { jsx as _jsx } from "react/jsx-runtime";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProviderConnectForm } from './ProviderConnectForm';
export function ProviderConnectDialog({ open, onOpenChange, onConnected, }) {
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsx(DialogContent, { className: "max-h-[90vh] overflow-y-auto sm:max-w-xl", children: _jsx(ProviderConnectForm, { onConnected: (result) => {
                    onConnected(result);
                    onOpenChange(false);
                }, onCancel: () => onOpenChange(false) }) }) }));
}
//# sourceMappingURL=ProviderConnectDialog.js.map