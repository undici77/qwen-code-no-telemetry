export function getQwenCapabilityCacheKey(workspaceId, workingDirectory, connectionSlug) {
    const workspace = workspaceId?.trim();
    if (!workspace)
        return null;
    return [
        workspace,
        (workingDirectory ?? '').trim(),
        (connectionSlug ?? '').trim(),
    ].join('\u0000');
}
export function getWorkspaceSkillsCacheKey(workspaceId, workingDirectory) {
    const workspace = workspaceId?.trim();
    if (!workspace)
        return null;
    return [workspace, (workingDirectory ?? '').trim()].join('\u0000');
}
export function providerSkillsFromQwenCapabilities(snapshot) {
    if (snapshot.availableSkillDetails?.length) {
        return snapshot.availableSkillDetails.map(providerSkillFromDetail);
    }
    const commandDescriptions = new Map(snapshot.availableCommands.map((command) => [
        command.name,
        command.description,
    ]));
    return (snapshot.availableSkills ?? []).map((name) => providerSkillFromName(name, commandDescriptions.get(name)));
}
export function qwenCapabilitiesFromSkills(skills) {
    const invocableSkills = skills.filter((skill) => skill.enabled !== false);
    return {
        availableCommands: [],
        availableSkills: invocableSkills.map((skill) => skill.slug),
        availableSkillDetails: skills.map(skillDetailFromProviderSkill),
        skills,
    };
}
function providerSkillFromDetail(detail) {
    return {
        slug: detail.name,
        metadata: {
            name: detail.name,
            description: detail.description ?? 'Qwen Code skill',
        },
        content: detail.body ?? '',
        path: detail.filePath ? dirnameLike(detail.filePath) : '',
        source: 'provider',
        enabled: detail.modelInvocable !== false,
        providerLevel: detail.level,
    };
}
function providerSkillFromName(name, description) {
    return providerSkillFromDetail({
        name,
        ...(description !== undefined ? { description } : {}),
    });
}
function skillDetailFromProviderSkill(skill) {
    const path = skill.path ? `${skill.path.replace(/[\\/]+$/, '')}/SKILL.md` : '';
    return {
        name: skill.slug,
        ...(skill.metadata.description
            ? { description: skill.metadata.description }
            : {}),
        ...(skill.content ? { body: skill.content } : {}),
        ...(path ? { filePath: path } : {}),
        ...(skill.providerLevel ? { level: skill.providerLevel } : {}),
        ...(skill.enabled !== undefined ? { modelInvocable: skill.enabled } : {}),
    };
}
function dirnameLike(filePath) {
    const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return slash >= 0 ? filePath.slice(0, slash) : '';
}
//# sourceMappingURL=qwen-capability-cache.js.map