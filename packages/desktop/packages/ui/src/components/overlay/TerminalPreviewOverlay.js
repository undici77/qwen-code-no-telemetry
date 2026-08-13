import { jsx as _jsx } from "react/jsx-runtime";
/**
 * TerminalPreviewOverlay - Overlay for terminal output (Bash/Grep/Glob tools)
 *
 * Uses PreviewOverlay for presentation and TerminalOutput for display.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Search, FolderSearch } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
import { ContentFrame } from './ContentFrame';
import { TerminalOutput } from '../terminal/TerminalOutput';
function getToolConfig(toolType) {
    switch (toolType) {
        case 'grep':
            return { icon: Search, label: 'Grep', variant: 'green' };
        case 'glob':
            return { icon: FolderSearch, label: 'Glob', variant: 'purple' };
        default:
            return { icon: Terminal, label: 'Bash', variant: 'gray' };
    }
}
export function TerminalPreviewOverlay({ isOpen, onClose, command, output, exitCode, toolType = 'bash', description, theme = 'light', error, embedded, }) {
    const { t } = useTranslation();
    const config = getToolConfig(toolType);
    return (_jsx(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: {
            icon: config.icon,
            label: config.label,
            variant: config.variant,
        }, title: description || '', error: error ? { label: 'Command Failed', message: error } : undefined, embedded: embedded, className: "bg-foreground-3", children: _jsx(ContentFrame, { title: t('overlay.terminal'), children: _jsx("div", { className: "flex-1 overflow-y-auto min-h-0", children: _jsx(TerminalOutput, { command: command, output: output, exitCode: exitCode, toolType: toolType, description: description, theme: theme }) }) }) }));
}
//# sourceMappingURL=TerminalPreviewOverlay.js.map