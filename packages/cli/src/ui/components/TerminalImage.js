import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import path from 'node:path';
import React from 'react';
import { Box, Text, useIsScreenReaderEnabled } from 'ink';
import { MaxSizedBox } from './shared/MaxSizedBox.js';
import { useTerminalOutput } from '../contexts/TerminalOutputContext.js';
import { markKittyImageWritten, prepareInlineTerminalImage, renderTerminalImage, wasKittyImageWritten, } from '../utils/terminal-image-renderer.js';
import { theme } from '../semantic-colors.js';
import { sanitizeMultilineForDisplay, sanitizeTerminalText, } from '../utils/textUtils.js';
const RenderedTerminalImage = ({ result, unavailableText, contentWidth, availableTerminalHeight }) => {
    const writeRaw = useTerminalOutput();
    React.useEffect(() => {
        if (result.kind !== 'kitty')
            return;
        if (wasKittyImageWritten(result.key))
            return;
        markKittyImageWritten(result.key);
        const sequence = result.sequence;
        process.nextTick(() => writeRaw(sequence));
    }, [result, writeRaw]);
    if (result.kind === 'unavailable') {
        return (_jsx(Text, { color: theme.text.secondary, wrap: "wrap", children: unavailableText }));
    }
    if (result.kind === 'ansi') {
        return (_jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: contentWidth, overflowDirection: "bottom", children: result.lines.map((line, index) => (_jsx(Box, { children: _jsx(Text, { children: line || ' ' }) }, index))) }));
    }
    return (_jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: contentWidth, overflowDirection: "bottom", children: result.placeholder.lines.map((line, index) => (_jsx(Box, { children: _jsx(Text, { color: result.placeholder.color, wrap: "truncate-end", children: line }) }, index))) }));
};
const FileTerminalImage = ({ data, config, contentWidth, availableTerminalHeight, }) => {
    const filePath = path.resolve(data.filePath);
    const safePath = config.getWorkspaceContext().isPathWithinWorkspace(filePath);
    const result = React.useMemo(() => safePath
        ? renderTerminalImage({
            display: {
                type: 'terminal_image',
                filePath,
                mimeType: data.mimeType,
            },
            contentWidth,
            availableTerminalHeight,
        })
        : null, [availableTerminalHeight, contentWidth, data.mimeType, filePath, safePath]);
    if (!safePath) {
        return (_jsx(Text, { color: theme.status.error, children: "Refusing to display an image outside the current workspace." }));
    }
    if (!result)
        return null;
    const unavailableText = result.kind === 'unavailable'
        ? `${sanitizeMultilineForDisplay(path.basename(filePath))}: ${sanitizeTerminalText(result.reason)}`
        : '';
    return (_jsx(RenderedTerminalImage, { result: result, unavailableText: unavailableText, contentWidth: contentWidth, availableTerminalHeight: availableTerminalHeight }));
};
const InlineTerminalImage = ({ image, contentWidth, availableTerminalHeight, }) => {
    const isScreenReaderEnabled = useIsScreenReaderEnabled();
    const prepared = React.useMemo(() => prepareInlineTerminalImage({
        data: image.data,
        mimeType: image.mimeType,
        contentWidth,
        availableTerminalHeight,
        disabled: isScreenReaderEnabled,
    }), [
        availableTerminalHeight,
        contentWidth,
        image.data,
        image.mimeType,
        isScreenReaderEnabled,
    ]);
    if (!prepared.result) {
        return _jsx(Text, { color: theme.text.secondary, children: prepared.fallbackText });
    }
    return (_jsx(RenderedTerminalImage, { result: prepared.result, unavailableText: prepared.result.kind === 'unavailable'
            ? `${prepared.fallbackText}: ${sanitizeTerminalText(prepared.result.reason)}`
            : prepared.fallbackText, contentWidth: contentWidth, availableTerminalHeight: availableTerminalHeight }));
};
export const TerminalImage = (props) => 'image' in props ? (_jsx(InlineTerminalImage, { ...props })) : (_jsx(FileTerminalImage, { ...props }));
//# sourceMappingURL=TerminalImage.js.map