import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SessionUpload - File upload component for session JSON files
 *
 * Supports:
 * - Click to browse files
 * - Drag and drop
 * - Paste from clipboard
 */
import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileJson, AlertCircle } from 'lucide-react';
export function SessionUpload({ onSessionLoad }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const parseSessionFile = useCallback(async (file) => {
        setError(null);
        if (!file.name.endsWith('.json')) {
            setError('Please upload a JSON file');
            return;
        }
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            // Validate basic session structure
            if (!data.id || !data.messages || !Array.isArray(data.messages)) {
                setError('Invalid session format: missing id or messages array');
                return;
            }
            onSessionLoad(data);
        }
        catch {
            setError('Failed to parse JSON file');
        }
    }, [onSessionLoad]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            parseSessionFile(file);
        }
    }, [parseSessionFile]);
    const handleFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            parseSessionFile(file);
        }
    }, [parseSessionFile]);
    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    // Handle paste from clipboard
    useEffect(() => {
        const handlePaste = async (e) => {
            const text = e.clipboardData?.getData('text');
            if (!text)
                return;
            try {
                const data = JSON.parse(text);
                if (data.id && data.messages && Array.isArray(data.messages)) {
                    onSessionLoad(data);
                }
            }
            catch {
                // Not valid JSON, ignore
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onSessionLoad]);
    return (_jsxs("div", { className: "w-full max-w-xl", children: [_jsxs("div", { onClick: handleClick, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, className: `
          drop-zone cursor-pointer rounded-lg border-2 border-dashed p-12
          flex flex-col items-center justify-center gap-4
          transition-all duration-200
          ${isDragging
                    ? 'active border-accent bg-accent/5'
                    : 'border-foreground/10 hover:border-foreground/20 hover:bg-foreground/3'}
        `, children: [_jsx("div", { className: `
          p-4 rounded-full
          ${isDragging ? 'bg-accent/10 text-accent' : 'bg-foreground/5 text-foreground/50'}
        `, children: isDragging ? (_jsx(FileJson, { className: "w-8 h-8" })) : (_jsx(Upload, { className: "w-8 h-8" })) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-medium text-foreground", children: isDragging ? 'Drop session file here' : 'Upload session JSON' }), _jsx("p", { className: "mt-1 text-sm text-foreground/50", children: "Drag and drop, click to browse, or paste from clipboard" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".json", onChange: handleFileSelect, className: "hidden" })] }), error && (_jsxs("div", { className: "mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: error })] })), _jsxs("div", { className: "mt-6 text-center text-xs text-foreground/30", children: [_jsx("p", { children: "Session files are processed locally in your browser." }), _jsx("p", { children: "No data is uploaded to any server." })] })] }));
}
//# sourceMappingURL=SessionUpload.js.map