const FILE_ORDER_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});
export function sortFilesForAttachmentInput(files) {
    return [...files].sort((a, b) => FILE_ORDER_COLLATOR.compare(a.name, b.name) ||
        a.lastModified - b.lastModified);
}
//# sourceMappingURL=file-attachment-order.js.map