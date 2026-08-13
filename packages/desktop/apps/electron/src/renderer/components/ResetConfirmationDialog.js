import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { useRegisterModal } from "@/context/ModalContext";
/**
 * ResetConfirmationDialog - Destructive action confirmation with math problem
 *
 * Shows a warning about data loss and requires the user to solve a random
 * math problem to confirm the reset action.
 */
export function ResetConfirmationDialog({ open, onConfirm, onCancel, }) {
    const { t } = useTranslation();
    const [answer, setAnswer] = useState("");
    // Register with modal context so X button / Cmd+W closes this dialog first
    useRegisterModal(open, onCancel);
    // Generate a random math problem when dialog opens
    const problem = useMemo(() => {
        const a = Math.floor(Math.random() * 50) + 10;
        const b = Math.floor(Math.random() * 50) + 10;
        return { a, b, sum: a + b };
    }, [open]); // Regenerate when dialog opens
    const isCorrect = parseInt(answer) === problem.sum;
    const handleConfirm = () => {
        if (isCorrect) {
            setAnswer("");
            onConfirm();
        }
    };
    const handleCancel = () => {
        setAnswer("");
        onCancel();
    };
    return (_jsx(Dialog, { open: open, onOpenChange: (isOpen) => !isOpen && handleCancel(), children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2 text-destructive", children: [_jsx(AlertTriangle, { className: "h-5 w-5" }), t("dialog.reset.title")] }), _jsx(DialogDescription, { className: "text-left pt-2", children: _jsx(Trans, { i18nKey: "dialog.reset.description", components: { strong: _jsx("strong", {}) } }) })] }), _jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2", children: [_jsx("li", { children: t("dialog.reset.workspaces") }), _jsx("li", { children: t("dialog.reset.credentials") }), _jsx("li", { children: t("dialog.reset.preferences") })] }), _jsxs("div", { className: "bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm", children: [_jsx("strong", { className: "text-amber-600 dark:text-amber-400", children: t("dialog.reset.backupWarning") }), _jsx("p", { className: "text-muted-foreground mt-1", children: t("dialog.reset.cannotUndo") })] }), _jsxs("div", { className: "space-y-2 pt-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("dialog.reset.confirmSolve", { a: problem.a, b: problem.b }) }), _jsx(Input, { type: "text", inputMode: "numeric", pattern: "[0-9]*", placeholder: t("dialog.reset.enterAnswer"), value: answer, onChange: (e) => setAnswer(e.target.value), onKeyDown: (e) => {
                                if (e.key === "Enter" && isCorrect) {
                                    handleConfirm();
                                }
                            }, className: "max-w-32" })] }), _jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [_jsx(Button, { variant: "outline", onClick: handleCancel, children: t("common.cancel") }), _jsx(Button, { variant: "destructive", disabled: !isCorrect, onClick: handleConfirm, children: t("dialog.reset.title") })] })] }) }));
}
//# sourceMappingURL=ResetConfirmationDialog.js.map