import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { useState } from 'react';
// Simple Markdown Parser Component
export function MarkdownText({ children }) {
    if (!children || typeof children !== 'string')
        return children;
    // Split by bold markers (**text**)
    const parts = children.split(/(\*\*.*?\*\*)/g);
    return (_jsx(_Fragment, { children: parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return _jsx("strong", { children: part.slice(2, -2) }, i);
            }
            return part;
        }) }));
}
export function CopyButton({ text, label = 'Copy', }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (_jsx("button", { className: "copy-btn", onClick: handleCopy, children: copied ? 'Copied!' : label }));
}
//# sourceMappingURL=Components.js.map