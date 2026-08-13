import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AlertCircleIcon, UploadIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import { extractErrorDetail } from '../../utils/errorDetail';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { Spinner } from '../ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
const MAX_SKILL_ZIP_BYTES = 6 * 1024 * 1024;
function installErrorMessage(error, t) {
    const body = error && typeof error === 'object'
        ? error.body
        : undefined;
    const code = body && typeof body === 'object'
        ? body.code
        : undefined;
    if (code === 'invalid_skill_source')
        return t('skills.install.error.invalidSource');
    if (code === 'invalid_skill_scope')
        return t('skills.install.error.invalidScope');
    if (code === 'invalid_skill_name')
        return t('skills.install.error.invalidName');
    if (code === 'skill_manifest_missing')
        return t('skills.install.error.manifestMissing');
    if (code === 'invalid_skill_package' ||
        code === 'invalid_skill_manifest' ||
        code === 'skill_name_mismatch' ||
        code === 'unsafe_skill_path') {
        return t('skills.install.error.invalidPackage');
    }
    if (code === 'skill_package_too_large')
        return t('skills.install.error.zipTooLarge');
    if (code === 'invalid_skill_folder')
        return t('skills.install.error.invalidFolder');
    if (code === 'github_api_failed' || code === 'github_skill_download_failed')
        return t('skills.install.error.githubFailed');
    if (code === 'skill_not_found')
        return t('skills.install.error.notFound');
    if (code === 'token_required')
        return t('skills.install.error.authentication');
    if (code === 'untrusted_workspace')
        return t('skills.install.error.untrusted');
    return extractErrorDetail(error) || t('skills.install.failed');
}
async function fileToBase64(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
}
export function SkillInstallDialog({ open, onOpenChange, onInstall, }) {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [scope, setScope] = useState('workspace');
    const [source, setSource] = useState('github');
    const [githubUrl, setGithubUrl] = useState('');
    const [folderPath, setFolderPath] = useState('');
    const [zip, setZip] = useState(null);
    const [installing, setInstalling] = useState(false);
    const [error, setError] = useState(null);
    function reset() {
        setName('');
        setScope('workspace');
        setSource('github');
        setGithubUrl('');
        setFolderPath('');
        setZip(null);
        setError(null);
    }
    async function submit() {
        setInstalling(true);
        setError(null);
        try {
            if (!name.trim())
                throw new Error(t('skills.install.error.nameRequired'));
            let installSource;
            if (source === 'github') {
                if (!githubUrl.trim())
                    throw new Error(t('skills.install.error.githubRequired'));
                installSource = { type: 'github', url: githubUrl.trim() };
            }
            else if (source === 'folder') {
                if (!folderPath.trim())
                    throw new Error(t('skills.install.error.folderRequired'));
                installSource = { type: 'folder', path: folderPath.trim() };
            }
            else {
                if (!zip)
                    throw new Error(t('skills.install.selectZip'));
                if (zip.size > MAX_SKILL_ZIP_BYTES) {
                    throw new Error(t('skills.install.error.zipTooLarge'));
                }
                installSource = {
                    type: 'zip',
                    contentBase64: await fileToBase64(zip),
                };
            }
            await onInstall({ name: name.trim(), scope, source: installSource });
            onOpenChange(false);
            reset();
        }
        catch (installError) {
            setError(installErrorMessage(installError, t));
        }
        finally {
            setInstalling(false);
        }
    }
    return (_jsx(Dialog, { open: open, onOpenChange: (nextOpen) => {
            if (installing)
                return;
            onOpenChange(nextOpen);
            if (!nextOpen)
                reset();
        }, children: _jsxs(DialogContent, { className: "sm:max-w-lg", showCloseButton: false, onPointerDownOutside: (event) => event.preventDefault(), children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('skills.install.title') }), _jsx(DialogDescription, { children: t('skills.install.description') })] }), _jsxs("div", { className: "grid gap-4", children: [error ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircleIcon, {}), _jsx(AlertDescription, { children: error })] })) : null, _jsxs("label", { className: "grid gap-2 text-sm font-medium", children: [t('skills.install.name'), _jsx(Input, { value: name, onChange: (event) => setName(event.target.value), placeholder: "my-skill", disabled: installing })] }), _jsxs("label", { className: "grid gap-2 text-sm font-medium", children: [t('skills.install.scope'), _jsxs(Select, { value: scope, onValueChange: (value) => setScope(value), disabled: installing, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "workspace", children: t('skills.install.scope.workspace') }), _jsx(SelectItem, { value: "global", children: t('skills.install.scope.global') })] })] })] }), _jsxs(Tabs, { value: source, onValueChange: (value) => setSource(value), children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "github", disabled: installing, children: "GitHub" }), _jsx(TabsTrigger, { value: "folder", disabled: installing, children: t('skills.install.folder') }), _jsx(TabsTrigger, { value: "zip", disabled: installing, children: "ZIP" })] }), _jsx(TabsContent, { value: "github", className: "pt-3", children: _jsxs("label", { className: "grid gap-2 text-sm font-medium", children: [t('skills.install.githubUrl'), _jsx(Input, { type: "url", value: githubUrl, onChange: (event) => setGithubUrl(event.target.value), placeholder: "https://github.com/owner/repo/blob/main/skill/SKILL.md", disabled: installing })] }) }), _jsx(TabsContent, { value: "folder", className: "pt-3", children: _jsxs("label", { className: "grid gap-2 text-sm font-medium", children: [t('skills.install.folderPath'), _jsx(Input, { value: folderPath, onChange: (event) => setFolderPath(event.target.value), placeholder: "/absolute/path/to/my-skill", disabled: installing })] }) }), _jsx(TabsContent, { value: "zip", className: "pt-3", children: _jsxs("div", { className: "grid gap-2", children: [_jsx(Input, { type: "file", accept: ".zip,application/zip", onChange: (event) => {
                                                    const file = event.target.files?.[0] ?? null;
                                                    setZip(file);
                                                    if (file) {
                                                        setName((currentName) => currentName || file.name.replace(/\.zip$/i, ''));
                                                    }
                                                }, disabled: installing }), zip ? (_jsx("div", { className: "text-xs text-muted-foreground", children: t('skills.install.zipSelected', { name: zip.name }) })) : null] }) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                onOpenChange(false);
                                reset();
                            }, disabled: installing, children: t('common.cancel') }), _jsxs(Button, { onClick: () => void submit(), disabled: installing, children: [installing ? (_jsx(Spinner, { "data-icon": "inline-start" })) : (_jsx(UploadIcon, { "data-icon": "inline-start" })), t('skills.install.action')] })] })] }) }));
}
//# sourceMappingURL=SkillInstallDialog.js.map