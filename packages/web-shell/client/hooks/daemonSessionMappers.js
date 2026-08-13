export function mergeCommands(...groups) {
    const byName = new Map();
    for (const group of groups) {
        for (const command of group) {
            const existing = byName.get(command.name);
            if (existing) {
                byName.set(command.name, {
                    ...existing,
                    ...command,
                    description: command.description || existing.description,
                    argumentHint: command.argumentHint ?? existing.argumentHint,
                });
            }
            else {
                byName.set(command.name, command);
            }
        }
    }
    return [...byName.values()];
}
//# sourceMappingURL=daemonSessionMappers.js.map