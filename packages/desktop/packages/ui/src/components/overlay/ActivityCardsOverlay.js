import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useMemo } from 'react';
import JsonView from '@uiw/react-json-view';
import { vscodeTheme } from '@uiw/react-json-view/vscode';
import { githubLightTheme } from '@uiw/react-json-view/githubLight';
import { Layers, Check, Copy } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
import { ContentFrame } from './ContentFrame';
import { ShikiCodeViewer } from '../code-viewer/ShikiCodeViewer';
import { TerminalOutput } from '../terminal/TerminalOutput';
import { Markdown } from '../markdown';
import { CodeBlock } from '../markdown/CodeBlock';
import { detectLanguage } from './GenericOverlay';
const craftAgentDarkTheme = {
    ...vscodeTheme,
    '--w-rjv-font-family': 'var(--font-mono, ui-monospace, monospace)',
    '--w-rjv-background-color': 'transparent',
};
const craftAgentLightTheme = {
    ...githubLightTheme,
    '--w-rjv-font-family': 'var(--font-mono, ui-monospace, monospace)',
    '--w-rjv-background-color': 'transparent',
};
function deepParseJson(value) {
    if (value === null || value === undefined)
        return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return deepParseJson(JSON.parse(trimmed));
            }
            catch {
                return value;
            }
        }
        return value;
    }
    if (Array.isArray(value))
        return value.map(deepParseJson);
    if (typeof value === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(value))
            result[k] = deepParseJson(v);
        return result;
    }
    return value;
}
export function ActivityCardsOverlay({ isOpen, onClose, cards, title, theme = 'light', onOpenUrl, onOpenFile, }) {
    const jsonTheme = useMemo(() => (theme === 'dark' ? craftAgentDarkTheme : craftAgentLightTheme), [theme]);
    const renderMarkdownCard = (card, content) => {
        return (_jsx(ContentFrame, { title: card.label, children: _jsx("div", { className: "px-10 pt-8 pb-8", children: _jsx("div", { className: "text-sm", children: _jsx(Markdown, { mode: "minimal", onUrlClick: onOpenUrl, onFileClick: onOpenFile, hideFirstMermaidExpand: false, children: content }) }) }) }));
    };
    const renderCard = (card) => {
        const data = card.data;
        const isInputCard = card.id === 'input';
        const commandPreview = card.commandPreview;
        if (data.type === 'json') {
            const processedData = deepParseJson(data.data);
            return (_jsx(ContentFrame, { title: card.label, children: _jsxs("div", { className: "flex-1 overflow-y-auto min-h-0 p-4 space-y-4", children: [isInputCard && commandPreview && (_jsxs("div", { className: "bg-background shadow-minimal rounded-[8px] px-4 py-3 font-mono", children: [_jsx("div", { className: "text-xs font-semibold text-muted-foreground/70 mb-1", children: "Command" }), _jsxs("div", { className: "text-sm text-foreground overflow-x-auto", children: [_jsx("span", { className: "text-muted-foreground select-none", children: "$ " }), _jsx("span", { children: commandPreview })] })] })), _jsxs("div", { children: [isInputCard && (_jsx("div", { className: "text-xs font-semibold text-muted-foreground/70 mb-2 px-1", children: "Input Params" })), _jsx("div", { className: "p-4", children: _jsx(JsonView, { value: processedData, style: jsonTheme, collapsed: false, enableClipboard: true, displayDataTypes: false, shortenTextAfterLength: 100, children: _jsx(JsonView.Copied, { render: (props) => {
                                                const isCopied = props['data-copied'];
                                                return isCopied ? (_jsx(Check, { className: "ml-1.5 inline-flex cursor-pointer text-green-500", size: 10, onClick: props.onClick })) : (_jsx(Copy, { className: "ml-1.5 inline-flex cursor-pointer text-muted-foreground hover:text-foreground", size: 10, onClick: props.onClick }));
                                            } }) }) })] })] }) }));
        }
        if (data.type === 'code') {
            return (_jsx(ContentFrame, { title: card.label, fitContent: true, minWidth: 850, children: _jsx(ShikiCodeViewer, { code: data.content, filePath: data.filePath, language: undefined, startLine: data.startLine, theme: theme }) }));
        }
        if (data.type === 'terminal') {
            return (_jsx(ContentFrame, { title: card.label, children: _jsx(TerminalOutput, { command: data.command, output: data.output, exitCode: data.exitCode, toolType: data.toolType, description: data.description, theme: theme }) }));
        }
        if (data.type === 'document') {
            return renderMarkdownCard(card, data.content);
        }
        const lang = detectLanguage(data.content);
        if (lang === 'markdown') {
            return renderMarkdownCard(card, data.content);
        }
        return (_jsx(ContentFrame, { title: card.label, children: _jsx("div", { className: "p-4", children: _jsx(CodeBlock, { code: data.content, language: lang, mode: "minimal", forcedTheme: theme }) }) }));
    };
    return (_jsx(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: { icon: Layers, label: 'Activity', variant: 'blue' }, title: title, className: "bg-foreground-3", children: _jsx("div", { className: "w-full space-y-6 py-1", children: cards.map((card) => (_jsx("div", { children: renderCard(card) }, card.id))) }) }));
}
//# sourceMappingURL=ActivityCardsOverlay.js.map