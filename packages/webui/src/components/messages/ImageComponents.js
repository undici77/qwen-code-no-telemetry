import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CloseSmallIcon } from '../icons/NavigationIcons.js';
export const ImagePreview = ({ images, onRemove }) => {
    if (images.length === 0) {
        return null;
    }
    return (_jsx("div", { className: "image-preview-container flex gap-2 px-2 pb-2", children: images.map((image) => (_jsx("div", { className: "image-preview-item relative group", children: _jsxs("div", { className: "relative", children: [_jsx("img", { src: image.data, alt: image.name, className: "w-14 h-14 object-cover rounded-md border border-gray-500 dark:border-gray-600", title: image.name }), _jsx("button", { type: "button", onClick: () => onRemove(image.id), className: "absolute -top-2 -right-2 w-5 h-5 bg-gray-700 dark:bg-gray-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800 dark:hover:bg-gray-500", "aria-label": `Remove ${image.name}`, children: _jsx(CloseSmallIcon, {}) })] }) }, image.id))) }));
};
export const ImageMessageRenderer = ({ msg, imageIndex, }) => {
    if (msg.kind !== 'image' || !msg.imagePath) {
        return null;
    }
    const label = `[Image #${imageIndex}]`;
    const showImage = Boolean(msg.imageSrc) && !msg.imageMissing;
    return (_jsx("div", { className: "qwen-message user-message-container flex gap-0 my-1 items-start text-left flex-col relative", children: _jsxs("div", { className: "inline-block relative whitespace-pre-wrap rounded-md max-w-full overflow-x-auto overflow-y-hidden select-text leading-[1.5]", style: {
                border: '1px solid var(--app-input-border)',
                borderRadius: 'var(--corner-radius-medium)',
                backgroundColor: 'var(--app-input-background)',
                padding: '6px 8px',
                color: 'var(--app-primary-foreground)',
            }, children: [_jsx("div", { style: {
                        fontSize: '12px',
                        color: 'var(--app-secondary-foreground)',
                        marginBottom: '4px',
                    }, children: label }), showImage ? (_jsx("img", { src: msg.imageSrc, alt: msg.imagePath, className: "max-w-full rounded-md border border-gray-600" })) : (_jsxs("div", { style: {
                        fontSize: '12px',
                        color: 'var(--app-secondary-foreground)',
                    }, children: ["@", msg.imagePath] }))] }) }));
};
//# sourceMappingURL=ImageComponents.js.map