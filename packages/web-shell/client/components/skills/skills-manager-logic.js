export function filterSkills(skills, query, level = 'all', status = 'all') {
    const normalized = query.trim().toLowerCase();
    return skills.filter((skill) => {
        if (level !== 'all' && skill.level !== level)
            return false;
        if (status === 'disabled' && skill.status !== 'disabled')
            return false;
        if (status === 'enabled' && skill.status === 'disabled')
            return false;
        if (!normalized)
            return true;
        return skill.name.toLowerCase().includes(normalized);
    });
}
export function preserveSkillSelection(name, skills) {
    return name && skills.some((skill) => skill.name === name) ? name : null;
}
//# sourceMappingURL=skills-manager-logic.js.map