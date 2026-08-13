import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TerminalOutput - Terminal-style display for command output
 *
 * Platform-agnostic component for displaying terminal output with:
 * - ANSI color code support
 * - Grep output line number highlighting
 * - Light/dark theme support
 * - Copy functionality
 */
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { parseAnsi, stripAnsi, isGrepContentOutput, parseGrepOutput } from './ansi-parser';
/**
 * TerminalOutput - Display terminal command and output with ANSI colors
 */
export function TerminalOutput({ command, output, exitCode, toolType = 'bash', description, theme = 'light', className, }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(null);
    const isDark = theme === 'dark';
    // Theme-aware colors for inner elements (outer bg inherits from overlay's bg-background)
    const textColor = isDark ? '#e4e4e4' : '#1a1a1a';
    const mutedColor = isDark ? '#888888' : '#666666';
    const matchColor = '#22c55e'; // Green for grep matches
    const cmdColor = isDark ? '#60a5fa' : '#2563eb'; // Blue for command
    const codeBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const outputBg = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)';
    // Copy to clipboard (strip ANSI codes for clean text)
    const copyToClipboard = useCallback(async (text, type) => {
        try {
            await navigator.clipboard.writeText(stripAnsi(text));
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        }
        catch (err) {
            console.error('Failed to copy:', err);
        }
    }, []);
    // Memoize ANSI-parsed output for performance
    const parsedOutput = useMemo(() => {
        if (!output)
            return [];
        return parseAnsi(output);
    }, [output]);
    // Check if this looks like grep content output
    const isGrepOutput = useMemo(() => {
        if (!output)
            return false;
        return isGrepContentOutput(output);
    }, [output]);
    // Parse grep output if applicable
    const grepLines = useMemo(() => {
        if (!isGrepOutput || !output)
            return [];
        return parseGrepOutput(output);
    }, [isGrepOutput, output]);
    return (_jsxs("div", { className: cn('h-full w-full overflow-auto px-5 py-4 font-mono text-sm', className), style: { fontFamily: '"JetBrains Mono", monospace' }, children: [_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs", style: { color: mutedColor }, children: [_jsx(Terminal, { className: "w-3 h-3" }), _jsx("span", { children: "Command" })] }), _jsx("button", { onClick: () => copyToClipboard(command, 'command'), className: cn('p-1 rounded transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'), title: copied === 'command' ? t('common.copied') : t('terminal.copyCommand'), children: copied === 'command' ? (_jsx(Check, { className: "h-3.5 w-3.5 text-green-500" })) : (_jsx(Copy, { className: "h-3.5 w-3.5", style: { color: mutedColor } })) })] }), _jsx("div", { className: "overflow-x-auto", children: _jsx("code", { className: "text-foreground", children: command }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs", style: { color: mutedColor }, children: [_jsx(Terminal, { className: "w-3 h-3" }), _jsx("span", { children: t('terminal.output') }), exitCode !== undefined && (_jsxs("span", { className: "px-1.5 py-0.5 rounded text-[10px]", style: {
                                            backgroundColor: exitCode === 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: exitCode === 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                                        }, children: ["exit ", exitCode] }))] }), _jsx("button", { onClick: () => copyToClipboard(output, 'output'), className: cn('p-1 rounded transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'), title: copied === 'output' ? t('common.copied') : t('terminal.copyOutput'), children: copied === 'output' ? (_jsx(Check, { className: "h-3.5 w-3.5 text-green-500" })) : (_jsx(Copy, { className: "h-3.5 w-3.5", style: { color: mutedColor } })) })] }), _jsx("pre", { className: "overflow-auto", style: { color: textColor }, children: isGrepOutput && grepLines.length > 0 ? (_jsx("div", { className: "space-y-0", children: grepLines.map((line, i) => (_jsxs("div", { className: "flex", style: {
                                    backgroundColor: line.isMatch ? 'rgba(34, 197, 94, 0.08)' : undefined,
                                }, children: [line.lineNum && (_jsxs("span", { className: "select-none pr-3 text-right shrink-0", style: {
                                            color: line.isMatch ? matchColor : mutedColor,
                                            minWidth: '3rem',
                                        }, children: [line.lineNum, _jsx("span", { style: { color: line.isMatch ? matchColor : (isDark ? '#444444' : '#cccccc') }, children: line.isMatch ? ':' : '-' })] })), _jsx("span", { className: "whitespace-pre-wrap break-words", style: { color: line.isMatch ? textColor : mutedColor }, children: line.content })] }, i))) })) : parsedOutput.length > 0 ? (
                        /* ANSI-colored output */
                        _jsx("div", { className: "whitespace-pre-wrap break-words", children: parsedOutput.map((span, i) => (_jsx("span", { style: {
                                    color: span.fg,
                                    backgroundColor: span.bg,
                                    fontWeight: span.bold ? 'bold' : undefined,
                                    // Add padding for background colors
                                    padding: span.bg ? '0 2px' : undefined,
                                    borderRadius: span.bg ? '2px' : undefined,
                                }, children: span.text }, i))) })) : (_jsx("span", { style: { color: mutedColor }, children: "(no output)" })) })] })] }));
}
//# sourceMappingURL=TerminalOutput.js.map