export function filterAgents(agents, query, level = 'all') {
    const normalized = query.trim().toLowerCase();
    return agents.filter((agent) => {
        if (level !== 'all' && agent.level !== level)
            return false;
        if (!normalized)
            return true;
        return agent.name.toLowerCase().includes(normalized);
    });
}
export function preserveAgentSelection(selection, agents) {
    if (!selection)
        return null;
    return (agents.find((agent) => agent.name === selection.name && agent.level === selection.level) ?? null);
}
export function isOverridden(agent, allAgents) {
    if (agent.level !== 'user')
        return false;
    return allAgents.some((a) => a.level === 'project' && a.name === agent.name);
}
export function canModifyAgent(agent) {
    return ((agent.level === 'project' || agent.level === 'user') && !agent.isBuiltin);
}
export function scopeForLevel(level) {
    if (level === 'project')
        return 'workspace';
    if (level === 'user')
        return 'global';
    return undefined;
}
//# sourceMappingURL=agents-manager-logic.js.map