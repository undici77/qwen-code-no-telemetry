import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { Spinner } from '@craft-agent/ui';
export function FileViewer({ path }) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!path) {
            setContent('');
            setError(null);
            return;
        }
        const loadFile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fileContent = await window.electronAPI.readFile(path);
                setContent(fileContent);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load file');
                setContent('');
            }
            finally {
                setIsLoading(false);
            }
        };
        loadFile();
    }, [path]);
    if (!path) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center", children: [_jsx("div", { className: "size-16 bg-muted rounded-2xl flex items-center justify-center mb-4", children: _jsx(FileText, { className: "size-8 text-muted-foreground/50" }) }), _jsx("p", { className: "font-medium text-foreground", children: t("fileViewer.noFileSelected") }), _jsx("p", { className: "text-sm mt-1", children: t("fileViewer.clickToView") })] }));
    }
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "px-4 py-3 bg-muted/50 border-b flex items-center gap-2 shrink-0", children: [_jsx(FileText, { className: "size-4 text-muted-foreground shrink-0" }), _jsx("p", { className: "text-xs font-mono text-muted-foreground truncate select-all", title: path, children: path })] }), _jsx(ScrollArea, { className: "flex-1", children: _jsx("div", { className: "p-4", children: isLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-32 text-muted-foreground gap-3", children: [_jsx(Spinner, { className: "text-lg" }), _jsx("span", { className: "text-sm font-medium", children: t("fileViewer.loadingContent") })] })) : error ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-32 text-destructive gap-2", children: [_jsx("p", { className: "text-sm font-medium", children: t("fileViewer.errorLoading") }), _jsx("p", { className: "text-xs", children: error })] })) : (_jsx("pre", { className: "text-sm whitespace-pre-wrap font-mono leading-relaxed selection:bg-foreground/20", children: content })) }) })] }));
}
//# sourceMappingURL=FileViewer.js.map