function arrayOrEmpty(value) {
    return Array.isArray(value) ? value : [];
}
function normalizeScopeState(state) {
    return {
        path: state?.path ?? '',
        values: state?.values ?? {},
        mcpServers: arrayOrEmpty(state?.mcpServers),
        hooks: arrayOrEmpty(state?.hooks),
    };
}
function normalizeExtension(extension) {
    return {
        id: extension.id ?? extension.name ?? '',
        name: extension.name ?? extension.id ?? '',
        displayName: extension.displayName,
        version: extension.version,
        isActive: extension.isActive,
        path: extension.path,
        commands: arrayOrEmpty(extension.commands),
        skills: arrayOrEmpty(extension.skills),
        mcpServers: arrayOrEmpty(extension.mcpServers),
        settings: arrayOrEmpty(extension.settings),
    };
}
export function normalizeQwenSettingsSnapshot(snapshot) {
    if (!snapshot)
        return null;
    const partial = snapshot;
    const extensions = partial.merged?.extensions ?? partial.extensions;
    return {
        user: normalizeScopeState(partial.user),
        workspace: normalizeScopeState(partial.workspace),
        merged: {
            values: partial.merged?.values ?? {},
            mcpServers: arrayOrEmpty(partial.merged?.mcpServers),
            hooks: arrayOrEmpty(partial.merged?.hooks),
            extensions: arrayOrEmpty(extensions).map(normalizeExtension),
        },
        workspaceTrusted: partial.workspaceTrusted ?? partial.isTrusted ?? false,
    };
}
//# sourceMappingURL=qwen-settings-snapshot.js.map