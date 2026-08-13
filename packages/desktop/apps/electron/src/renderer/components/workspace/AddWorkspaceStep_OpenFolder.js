import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { AddWorkspaceContainer, AddWorkspaceStepHeader, AddWorkspaceSecondaryButton, AddWorkspacePrimaryButton } from "./primitives";
import { useDirectoryPicker } from "@/hooks/useDirectoryPicker";
import { ServerDirectoryBrowser } from "@/components/ServerDirectoryBrowser";
/**
 * AddWorkspaceStep_OpenFolder - Open an existing folder as workspace
 */
export function AddWorkspaceStep_OpenFolder({ onBack, onCreate, isCreating }) {
    const { t } = useTranslation();
    const [selectedPath, setSelectedPath] = useState(null);
    const [workspaceName, setWorkspaceName] = useState('');
    const handleFolderSelected = useCallback((path) => {
        setSelectedPath(path);
        // Extract folder name for workspace name
        const folderName = path.split(/[\\/]/).pop() || path;
        setWorkspaceName(folderName);
    }, []);
    const { pickDirectory, showServerBrowser, serverBrowserMode, cancelServerBrowser, confirmServerBrowser, } = useDirectoryPicker(handleFolderSelected);
    const handleOpen = useCallback(async () => {
        if (!selectedPath || !workspaceName.trim())
            return;
        await onCreate(selectedPath, workspaceName.trim());
    }, [selectedPath, workspaceName, onCreate]);
    const canOpen = selectedPath && workspaceName.trim();
    return (_jsxs(AddWorkspaceContainer, { children: [_jsxs("button", { onClick: onBack, disabled: isCreating, className: cn("self-start flex items-center gap-1 text-sm text-muted-foreground", "hover:text-foreground transition-colors mb-4", isCreating && "opacity-50 cursor-not-allowed"), children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), t("common.back")] }), _jsx(AddWorkspaceStepHeader, { title: t("workspace.chooseExistingFolder"), description: t("workspace.chooseExistingFolderDesc") }), _jsxs("div", { className: "mt-6 w-full space-y-6", children: [_jsxs("div", { className: cn("flex items-center justify-between gap-4 p-4 rounded-xl", "border border-border/50 bg-background"), children: [_jsx("div", { className: "flex-1 min-w-0", children: selectedPath ? (_jsx("p", { className: "text-sm text-foreground truncate", children: selectedPath })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: t("workspace.noFolderSelected") })) }), _jsx(AddWorkspaceSecondaryButton, { onClick: pickDirectory, disabled: isCreating, children: t("common.browse") })] }), selectedPath && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: t("workspace.nameLabel") }), _jsx(Input, { value: workspaceName, onChange: (e) => setWorkspaceName(e.target.value), placeholder: t("workspace.myWorkspace"), disabled: isCreating })] })), _jsx(AddWorkspacePrimaryButton, { onClick: handleOpen, disabled: !canOpen || isCreating, loading: isCreating, loadingText: t("workspace.opening"), children: t("common.open") })] }), _jsx(ServerDirectoryBrowser, { open: showServerBrowser, mode: serverBrowserMode, onSelect: confirmServerBrowser, onCancel: cancelServerBrowser })] }));
}
//# sourceMappingURL=AddWorkspaceStep_OpenFolder.js.map