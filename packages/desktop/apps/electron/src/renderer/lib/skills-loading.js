/**
 * Skills back the sidebar count and mention metadata, so keep them loaded once
 * connection config is available. The Skills navigator also loads them directly
 * so the page works before connection state finishes hydrating.
 */
export function shouldLoadWorkspaceSkills({ isSkillsNavigation, llmConnectionCount, }) {
    return isSkillsNavigation || llmConnectionCount > 0;
}
//# sourceMappingURL=skills-loading.js.map