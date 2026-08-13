/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export const MCP_SERVER_REF_PREFIX = 'mcp:';
export function parseMcpServerRef(pathName) {
    if (!pathName.startsWith(MCP_SERVER_REF_PREFIX))
        return null;
    const name = pathName.slice(MCP_SERVER_REF_PREFIX.length);
    if (!name)
        return null;
    return { name };
}
export function buildMcpServerRef(serverName) {
    return `${MCP_SERVER_REF_PREFIX}${serverName}`;
}
export function matchMcpServerByRef(name, servers) {
    const lower = name.toLowerCase();
    const matchedName = Object.keys(servers).find((serverName) => serverName.toLowerCase() === lower);
    if (!matchedName)
        return undefined;
    return { serverName: matchedName, server: servers[matchedName] };
}
export function buildMcpServerContextText(config, serverName) {
    const lines = [
        `--- MCP Server: ${serverName} ---`,
        `The user explicitly mentioned this MCP server. Prefer using tools and resources from this server when relevant for this turn. This is advisory context, not a hard restriction.`,
    ];
    const prompts = config.getPromptRegistry?.()?.getPromptsByServer(serverName) ?? [];
    const resources = config.getResourceRegistry?.()?.getResourcesByServer(serverName) ?? [];
    const details = [];
    if (resources.length > 0) {
        details.push(`- Resources: ${resources.length}`);
    }
    if (prompts.length > 0) {
        details.push(`- Prompts: ${prompts.length}`);
    }
    if (details.length > 0) {
        lines.push('Available capabilities from this MCP server:');
        lines.push(...details);
    }
    lines.push(`--- End MCP Server: ${serverName} ---`);
    return lines.join('\n');
}
//# sourceMappingURL=mcp-server-mention.js.map