import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegisterModal } from "@/context/ModalContext";
export function RenameDialog({ open, onOpenChange, title, value, onValueChange, onSubmit, placeholder, }) {
    const { t } = useTranslation();
    const effectivePlaceholder = placeholder ?? t("common.enterName");
    const inputRef = useRef(null);
    // Register with modal context so X button / Cmd+W closes this dialog first
    useRegisterModal(open, () => onOpenChange(false));
    // Focus input after dialog opens (avoids Radix Dialog focus race condition)
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [open]);
    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit();
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[400px]", onOpenAutoFocus: (e) => e.preventDefault(), children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: title }) }), _jsx("div", { className: "py-4", children: _jsx(Input, { ref: inputRef, value: value, onChange: (e) => onValueChange(e.target.value), placeholder: effectivePlaceholder, onKeyDown: (e) => {
                            if (e.key === "Enter") {
                                handleSubmit();
                            }
                        } }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("common.cancel") }), _jsx(Button, { onClick: handleSubmit, disabled: !value.trim(), children: t("common.save") })] })] }) }));
}
//# sourceMappingURL=rename-dialog.js.map