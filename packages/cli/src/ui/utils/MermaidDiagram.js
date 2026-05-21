import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { MaxSizedBox } from '../components/shared/MaxSizedBox.js';
import { renderMermaidVisual } from './mermaidVisualRenderer.js';
import { renderMermaidImageAsync, } from './mermaidImageRenderer.js';
import { useTerminalOutput } from '../contexts/TerminalOutputContext.js';
const MERMAID_PADDING = 1;
function getRenderErrorReason(error) {
    return error instanceof Error ? error.message : String(error);
}
const MermaidDiagramInternal = ({ source, sourceCopyCommand, contentWidth, isPending, availableTerminalHeight, }) => {
    const writeRaw = useTerminalOutput();
    const preparedTerminalImageSequence = React.useRef(null);
    const [imageState, setImageState] = React.useState(null);
    const innerWidth = Math.max(8, contentWidth - MERMAID_PADDING);
    const imageKey = `${source}\0${innerWidth}\0${availableTerminalHeight ?? 'auto'}`;
    const image = imageState?.key === imageKey && !isPending ? imageState.result : null;
    const visual = React.useMemo(() => renderMermaidVisual(source, innerWidth), [source, innerWidth]);
    React.useEffect(() => {
        if (isPending) {
            setImageState(null);
            return;
        }
        let cancelled = false;
        const abortController = new AbortController();
        void renderMermaidImageAsync({
            source,
            contentWidth: innerWidth,
            availableTerminalHeight,
            signal: abortController.signal,
        }).then((result) => {
            if (!cancelled) {
                setImageState({ key: imageKey, result });
            }
        }, (error) => {
            if (!cancelled) {
                setImageState({
                    key: imageKey,
                    result: {
                        kind: 'unavailable',
                        reason: getRenderErrorReason(error),
                    },
                });
            }
        });
        return () => {
            cancelled = true;
            abortController.abort();
        };
    }, [availableTerminalHeight, imageKey, innerWidth, isPending, source]);
    const kittySequence = image?.kind === 'terminal-image' &&
        image.protocol === 'kitty' &&
        image.placeholder
        ? image.sequence
        : null;
    React.useEffect(() => {
        preparedTerminalImageSequence.current = null;
    }, [imageKey]);
    React.useEffect(() => {
        if (!kittySequence ||
            preparedTerminalImageSequence.current === kittySequence) {
            return;
        }
        preparedTerminalImageSequence.current = kittySequence;
        process.nextTick(() => writeRaw(kittySequence));
    }, [kittySequence, writeRaw]);
    const titleWithSourceHint = (title) => `${title} · source: ${sourceCopyCommand}`;
    if (image?.kind === 'terminal-image' &&
        image.protocol === 'kitty' &&
        image.placeholder) {
        return (_jsxs(Box, { paddingLeft: MERMAID_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: titleWithSourceHint(visual.title) }), _jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: innerWidth, overflowDirection: "bottom", children: image.placeholder.lines.map((line, index) => (_jsx(Box, { children: _jsx(Text, { color: image.placeholder.color, wrap: "truncate-end", children: line }) }, index))) })] }));
    }
    if (image?.kind === 'ansi') {
        return (_jsxs(Box, { paddingLeft: MERMAID_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: titleWithSourceHint(visual.title) }), _jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: innerWidth, overflowDirection: "bottom", children: image.lines.map((line, index) => (_jsx(Box, { children: _jsx(Text, { children: line || ' ' }) }, index))) })] }));
    }
    return (_jsxs(Box, { paddingLeft: MERMAID_PADDING, flexDirection: "column", width: contentWidth, flexShrink: 0, children: [_jsx(Text, { bold: true, color: theme.text.accent, children: titleWithSourceHint(visual.title) }), _jsx(MaxSizedBox, { maxHeight: availableTerminalHeight, maxWidth: innerWidth, overflowDirection: "bottom", children: visual.lines.map((line, index) => (_jsx(Box, { children: _jsx(Text, { color: theme.text.primary, children: line || ' ' }) }, index))) }), visual.warning && (_jsx(Text, { color: theme.text.secondary, wrap: "wrap", children: visual.warning })), !isPending &&
                image?.kind === 'unavailable' &&
                image.showReason !== false && (_jsxs(Text, { color: theme.text.secondary, wrap: "wrap", children: ["Image rendering unavailable: ", image.reason] }))] }));
};
export const MermaidDiagram = React.memo(MermaidDiagramInternal);
//# sourceMappingURL=MermaidDiagram.js.map