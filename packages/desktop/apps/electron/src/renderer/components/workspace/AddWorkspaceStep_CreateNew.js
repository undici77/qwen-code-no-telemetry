import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AddWorkspaceContainer, AddWorkspaceStepHeader, AddWorkspaceSecondaryButton, AddWorkspacePrimaryButton } from "./primitives";
import { AddWorkspace_RadioOption } from "./AddWorkspace_RadioOption";
import { useDirectoryPicker } from "@/hooks/useDirectoryPicker";
import { ServerDirectoryBrowser } from "@/components/ServerDirectoryBrowser";
/**
 * AddWorkspaceStep_CreateNew - Create a new workspace
 *
 * Fields:
 * - Workspace name (required)
 * - Location: Default (~/.craft-agent/workspaces/) or Custom
 */
export function AddWorkspaceStep_CreateNew({ onBack, onCreate, isCreating }) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [locationOption, setLocationOption] = useState('default');
    const [customPath, setCustomPath] = useState(null);
    const [homeDir, setHomeDir] = useState('');
    const [error, setError] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    // Get home directory on mount
    useEffect(() => {
        window.electronAPI.getHomeDir().then(setHomeDir);
    }, []);
    const slug = slugify(name);
    const defaultBasePath = homeDir ? `${homeDir}/.craft-agent/workspaces` : null;
    const finalPath = locationOption === 'default'
        ? (defaultBasePath && slug ? `${defaultBasePath}/${slug}` : null)
        : customPath && slug
            ? `${customPath}/${slug}`
            : null;
    // Validate slug uniqueness when name changes
    useEffect(() => {
        if (!slug) {
            setError(null);
            return;
        }
        const validateSlug = async () => {
            setIsValidating(true);
            try {
                const result = await window.electronAPI.checkWorkspaceSlug(slug);
                if (result.exists) {
                    setError(`A workspace named "${slug}" already exists`);
                }
                else {
                    setError(null);
                }
            }
            catch (err) {
                console.error('Failed to validate workspace slug:', err);
            }
            finally {
                setIsValidating(false);
            }
        };
        // Debounce validation
        const timeout = setTimeout(validateSlug, 300);
        return () => clearTimeout(timeout);
    }, [slug]);
    const handleFolderSelected = useCallback((path) => {
        setCustomPath(path);
    }, []);
    const { pickDirectory, showServerBrowser, serverBrowserMode, cancelServerBrowser, confirmServerBrowser, } = useDirectoryPicker(handleFolderSelected);
    const handleCreate = useCallback(async () => {
        if (!name.trim() || !finalPath || error)
            return;
        await onCreate(finalPath, name.trim());
    }, [name, finalPath, error, onCreate]);
    const canCreate = name.trim() && finalPath && !error && !isValidating && !isCreating;
    return (_jsxs(AddWorkspaceContainer, { children: [_jsxs("button", { onClick: onBack, disabled: isCreating, className: cn("self-start flex items-center gap-1 text-sm text-muted-foreground", "hover:text-foreground transition-colors mb-4", isCreating && "opacity-50 cursor-not-allowed"), children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), t("common.back")] }), _jsx(AddWorkspaceStepHeader, { title: t("workspace.createWorkspace"), description: t("workspace.createWorkspaceDesc") }), _jsxs("div", { className: "mt-6 w-full space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2.5", children: t("workspace.nameLabel") }), _jsx("div", { className: "bg-background shadow-minimal rounded-lg", children: _jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: t("workspace.myWorkspace"), disabled: isCreating, autoFocus: true, className: "border-0 bg-transparent shadow-none" }) }), error && (_jsx("p", { className: "text-xs text-destructive", children: error }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2.5", children: t("workspace.locationLabel") }), _jsx(AddWorkspace_RadioOption, { name: "location", checked: locationOption === 'default', onChange: () => setLocationOption('default'), disabled: isCreating, title: t("workspace.defaultLocation"), subtitle: t("workspace.underDefaultFolder") }), _jsx(AddWorkspace_RadioOption, { name: "location", checked: locationOption === 'custom', onChange: () => setLocationOption('custom'), disabled: isCreating, title: t("workspace.chooseLocation"), subtitle: customPath || t("workspace.pickLocation"), action: locationOption === 'custom' ? (_jsx(AddWorkspaceSecondaryButton, { onClick: (e) => {
                                        e.preventDefault();
                                        pickDirectory();
                                    }, disabled: isCreating, children: t("common.browse") })) : undefined })] }), _jsx(AddWorkspacePrimaryButton, { onClick: handleCreate, disabled: !canCreate, loading: isCreating, loadingText: t("workspace.creating"), children: t("common.create") })] }), _jsx(ServerDirectoryBrowser, { open: showServerBrowser, mode: serverBrowserMode, onSelect: confirmServerBrowser, onCancel: cancelServerBrowser })] }));
}
//# sourceMappingURL=AddWorkspaceStep_CreateNew.js.map