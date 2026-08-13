import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepFormLayout, BackButton } from "./primitives";
/**
 * GitBashWarning - Warning screen when Git Bash is not found on Windows
 *
 * Shows:
 * - Warning message explaining why Git Bash is needed
 * - Download link to Git for Windows
 * - Option to manually specify bash.exe path
 * - Option to skip and continue anyway
 */
export function GitBashWarning({ status, onBrowse, onUsePath, onRecheck, onBack, isRechecking = false, errorMessage, onClearError, }) {
    const { t } = useTranslation();
    const [customPath, setCustomPath] = useState(status.path || '');
    const [showCustomPath, setShowCustomPath] = useState(false);
    const handleBrowse = async () => {
        const path = await onBrowse();
        if (path) {
            setCustomPath(path);
            setShowCustomPath(true);
        }
    };
    const handleUsePath = () => {
        if (customPath.trim()) {
            onUsePath(customPath.trim());
        }
    };
    const handleDownload = () => {
        window.electronAPI.openUrl('https://git-scm.com/downloads/win');
    };
    return (_jsx(StepFormLayout, { title: t("onboarding.gitBash.title"), description: t("onboarding.gitBash.description"), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-lg border border-border bg-foreground-2 p-4", children: [_jsx("h3", { className: "text-sm font-medium text-foreground", children: t("onboarding.gitBash.installTitle") }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("onboarding.gitBash.installDesc") }), _jsxs(Button, { onClick: handleDownload, className: "mt-3 w-full bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", size: "sm", children: [_jsx(Download, { className: "mr-2 size-4" }), t("onboarding.gitBash.download")] })] }), _jsxs("div", { className: "rounded-lg border border-border bg-foreground-2 p-4", children: [_jsx("h3", { className: "text-sm font-medium text-foreground", children: t("onboarding.gitBash.alreadyInstalled") }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("onboarding.gitBash.customPath") }), showCustomPath ? (_jsxs("div", { className: "mt-3 space-y-2", children: [_jsx(Input, { value: customPath, onChange: (e) => {
                                        setCustomPath(e.target.value);
                                        onClearError?.();
                                    }, placeholder: t("onboarding.gitBash.pathPlaceholder"), className: "text-xs" }), _jsx(Button, { onClick: handleUsePath, disabled: !customPath.trim(), className: "w-full bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", size: "sm", children: t("onboarding.gitBash.useThisPath") }), errorMessage && (_jsx("p", { className: "text-xs text-red-500", children: errorMessage }))] })) : (_jsxs("div", { className: "mt-3 flex gap-2", children: [_jsxs(Button, { onClick: onRecheck, disabled: isRechecking, size: "sm", className: "flex-1 bg-background text-foreground hover:bg-foreground/5 rounded-lg shadow-minimal", children: [_jsx(RefreshCw, { className: `mr-2 size-4 ${isRechecking ? 'animate-spin' : ''}` }), isRechecking ? t("common.checking") : t("onboarding.gitBash.recheck")] }), _jsxs(Button, { onClick: handleBrowse, size: "sm", className: "flex-1 bg-background text-foreground hover:bg-foreground/5 rounded-lg shadow-minimal", children: [_jsx(FolderOpen, { className: "mr-2 size-4" }), t("onboarding.gitBash.browse")] })] }))] }), _jsx("div", { className: "flex justify-center pt-2", children: _jsx(BackButton, { onClick: onBack, className: "max-w-[200px]" }) })] }) }));
}
//# sourceMappingURL=GitBashWarning.js.map