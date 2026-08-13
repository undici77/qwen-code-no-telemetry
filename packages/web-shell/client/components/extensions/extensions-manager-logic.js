export function preserveSelectedExtensionName(name, extensions) {
    return name && extensions.some((extension) => extension.name === name)
        ? name
        : null;
}
export function filterExtensions(extensions, query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized)
        return [...extensions];
    return extensions.filter((extension) => [extension.name, extension.displayName, extension.description]
        .filter((value) => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalized)));
}
//# sourceMappingURL=extensions-manager-logic.js.map