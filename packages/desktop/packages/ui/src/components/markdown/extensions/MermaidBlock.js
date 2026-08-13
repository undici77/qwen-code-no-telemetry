import { jsx as _jsx } from "react/jsx-runtime";
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import * as React from 'react';
import { MarkdownMermaidBlock } from '../MarkdownMermaidBlock';
import { RichBlockShell } from '../RichBlockShell';
import { RICH_BLOCK_EDIT_EVENT } from '../rich-block-events';
export const MermaidBlock = Node.create({
    name: 'mermaidBlock',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
        return {
            code: {
                default: '',
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="mermaid-block"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid-block' })];
    },
    markdownTokenName: 'code',
    parseMarkdown: (token, helpers) => {
        if ((token.lang ?? '').toLowerCase() !== 'mermaid')
            return [];
        return helpers.createNode('mermaidBlock', { code: token.text ?? '' });
    },
    renderMarkdown: (node) => {
        const code = (node.attrs?.code ?? '').replace(/\n$/, '');
        return `\`\`\`mermaid\n${code}\n\`\`\``;
    },
    addNodeView() {
        return ReactNodeViewRenderer(({ node, editor, getPos }) => {
            const selectNode = () => {
                const pos = getPos();
                if (typeof pos !== 'number')
                    return;
                editor.chain().focus().setNodeSelection(pos).run();
            };
            const handleEditClick = () => {
                selectNode();
                queueMicrotask(() => editor.emit(RICH_BLOCK_EDIT_EVENT));
            };
            return (_jsx(NodeViewWrapper, { contentEditable: false, className: "tiptap-mermaid-block", "data-drag-handle": true, onMouseDownCapture: (event) => {
                    if (event.button !== 0)
                        return;
                    const target = event.target;
                    if (target?.closest('button'))
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    selectNode();
                }, children: _jsx(RichBlockShell, { onEdit: handleEditClick, editTitle: "Edit Mermaid", children: _jsx(MarkdownMermaidBlock, { code: node.attrs.code ?? '', showExpandButton: false, tapToOpen: false, minHeight: 140 }) }) }));
        });
    },
});
//# sourceMappingURL=MermaidBlock.js.map