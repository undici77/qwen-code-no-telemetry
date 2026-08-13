import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import * as React from 'react';
const FALLBACK_IMAGE_MIN_HEIGHT = 220;
function toPositiveNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0)
        return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0)
            return parsed;
    }
    return null;
}
function TiptapImageNodeView({ node, editor, getPos, updateAttributes }) {
    const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
    const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';
    const width = toPositiveNumber(node.attrs.width);
    const height = toPositiveNumber(node.attrs.height);
    const hasIntrinsicSize = width != null && height != null;
    const imageRef = React.useRef(null);
    const [loaded, setLoaded] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => {
        setLoaded(false);
        setFailed(false);
    }, [src]);
    React.useEffect(() => {
        const image = imageRef.current;
        if (!image)
            return;
        if (!image.complete)
            return;
        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            setLoaded(true);
            setFailed(false);
        }
        else {
            setFailed(true);
            setLoaded(false);
        }
    }, [src]);
    const captureIntrinsicDimensions = React.useCallback((image) => {
        if (hasIntrinsicSize)
            return;
        if (!image.naturalWidth || !image.naturalHeight)
            return;
        updateAttributes({
            width: image.naturalWidth,
            height: image.naturalHeight,
        });
    }, [hasIntrinsicSize, updateAttributes]);
    const selectNode = React.useCallback(() => {
        const pos = getPos();
        if (typeof pos !== 'number')
            return;
        editor.chain().focus().setNodeSelection(pos).run();
    }, [editor, getPos]);
    const shellStyle = hasIntrinsicSize
        ? { aspectRatio: `${width} / ${height}` }
        : !loaded && !failed
            ? { minHeight: `${FALLBACK_IMAGE_MIN_HEIGHT}px` }
            : undefined;
    return (_jsx(NodeViewWrapper, { contentEditable: false, className: "tiptap-image-block", "data-drag-handle": true, onMouseDownCapture: (event) => {
            if (event.button !== 0)
                return;
            const target = event.target;
            if (target?.closest('button'))
                return;
            event.preventDefault();
            event.stopPropagation();
            selectNode();
        }, children: _jsxs("div", { className: "tiptap-image-shell", "data-loading": !loaded && !failed ? 'true' : 'false', "data-error": failed ? 'true' : 'false', style: shellStyle, children: [!loaded && !failed && _jsx("div", { className: "tiptap-image-placeholder", "aria-hidden": "true" }), _jsx("img", { ref: imageRef, src: src, alt: alt, draggable: false, onLoad: (event) => {
                        const image = event.currentTarget;
                        captureIntrinsicDimensions(image);
                        setLoaded(true);
                        setFailed(false);
                    }, onError: () => {
                        setFailed(true);
                        setLoaded(false);
                    }, className: "tiptap-image-element", "data-loaded": loaded ? 'true' : 'false' })] }) }));
}
export const TiptapImageBlock = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element) => {
                    const value = element.getAttribute('width');
                    if (!value)
                        return null;
                    const parsed = Number.parseFloat(value);
                    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
                },
                renderHTML: (attributes) => {
                    if (!attributes.width)
                        return {};
                    return { width: attributes.width };
                },
            },
            height: {
                default: null,
                parseHTML: (element) => {
                    const value = element.getAttribute('height');
                    if (!value)
                        return null;
                    const parsed = Number.parseFloat(value);
                    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
                },
                renderHTML: (attributes) => {
                    if (!attributes.height)
                        return {};
                    return { height: attributes.height };
                },
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(TiptapImageNodeView);
    },
});
//# sourceMappingURL=TiptapImageBlock.js.map