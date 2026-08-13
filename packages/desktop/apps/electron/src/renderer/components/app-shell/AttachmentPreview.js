import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { Spinner, FileTypeIcon, getFileTypeLabel } from "@craft-agent/ui";
import { cn } from "@/lib/utils";
// Re-export for backward compatibility
export { FileTypeIcon, getFileTypeLabel };
/**
 * AttachmentPreview - attachment preview strip
 *
 * Shows attached files as small bubbles above the textarea:
 * - Image thumbnails for image files (48x48px)
 * - Icon + filename for text/PDF/code files
 * - X button on hover to remove
 * - Horizontally scrollable when many files
 * - Loading placeholders while files are being read
 */
export function AttachmentPreview({ attachments, onRemove, disabled, loadingCount = 0 }) {
    if (attachments.length === 0 && loadingCount === 0)
        return null;
    return (_jsxs("div", { className: "flex gap-2 px-4 py-3 border-b border-border/50 overflow-x-auto", children: [attachments.map((attachment, index) => (_jsx(AttachmentBubble, { attachment: attachment, onRemove: () => onRemove(index), disabled: disabled }, `${attachment.path}-${index}`))), Array.from({ length: loadingCount }).map((_, i) => (_jsx(LoadingBubble, {}, `loading-${i}`)))] }));
}
function LoadingBubble() {
    return (_jsx("div", { className: "h-16 w-16 rounded-[8px] bg-background shadow-minimal flex items-center justify-center shrink-0", children: _jsx(Spinner, { className: "text-muted-foreground" }) }));
}
function AttachmentBubble({ attachment, onRemove, disabled }) {
    const isImage = attachment.type === 'image';
    const hasThumbnail = !!attachment.thumbnailBase64;
    const hasImageBase64 = isImage && attachment.base64;
    // For images, use full base64; for docs, use Quick Look thumbnail
    const imageSrc = hasImageBase64
        ? `data:${attachment.mimeType};base64,${attachment.base64}`
        : hasThumbnail
            ? `data:image/png;base64,${attachment.thumbnailBase64}`
            : null;
    return (_jsxs("div", { className: "relative group shrink-0 select-none", children: [!disabled && (_jsx("button", { onClick: onRemove, className: cn("absolute -top-1.5 -right-1.5 z-10", "h-5 w-5 rounded-full", "bg-muted-foreground/90 text-background", "flex items-center justify-center", "opacity-0 group-hover:opacity-100 transition-opacity", "hover:bg-muted-foreground"), children: _jsx(X, { className: "h-3 w-3" }) })), isImage ? (
            /* IMAGE: Square thumbnail only */
            _jsx("div", { className: "h-16 w-16 rounded-[8px] overflow-hidden bg-background shadow-minimal", children: imageSrc ? (_jsx("img", { src: imageSrc, alt: attachment.name, className: "h-full w-full object-cover" })) : (_jsx("div", { className: "h-full w-full flex items-center justify-center", children: _jsx(ImageIcon, { className: "h-5 w-5 text-muted-foreground" }) })) })) : (
            /* DOCUMENT: Bubble with thumbnail/icon + 2-line text */
            _jsxs("div", { className: "h-16 flex items-center gap-2.5 rounded-[8px] bg-foreground/5 pl-1.5 pr-3", children: [_jsx("div", { className: "h-12 w-9 rounded-[6px] overflow-hidden bg-background shadow-minimal flex items-center justify-center shrink-0", children: hasThumbnail ? (_jsx("img", { src: `data:image/png;base64,${attachment.thumbnailBase64}`, alt: attachment.name, className: "h-full w-full object-cover object-top" })) : (_jsx(FileTypeIcon, { type: attachment.type, mimeType: attachment.mimeType, className: "h-5 w-5" })) }), _jsxs("div", { className: "flex flex-col min-w-0 max-w-[120px]", children: [_jsx("span", { className: "text-xs font-medium line-clamp-2 break-all", title: attachment.name, children: attachment.name }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: getFileTypeLabel(attachment.type, attachment.mimeType, attachment.name) })] })] }))] }));
}
//# sourceMappingURL=AttachmentPreview.js.map