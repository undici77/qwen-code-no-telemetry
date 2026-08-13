/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const REDACTED_MCP_SECRET = '__redacted__';
function recordOf(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}
function redactRecord(record) {
    return record
        ? Object.fromEntries(Object.keys(record).map((key) => [key, REDACTED_MCP_SECRET]))
        : record;
}
function restoreRecord(incoming, prior) {
    if (!incoming)
        return incoming;
    const priorRecord = recordOf(prior);
    const result = {};
    for (const [key, value] of Object.entries(incoming)) {
        if (value !== REDACTED_MCP_SECRET) {
            result[key] = value;
        }
        else if (typeof priorRecord[key] === 'string') {
            result[key] = priorRecord[key];
        }
    }
    return result;
}
export function redactMcpServerSecrets(server) {
    return {
        ...server,
        env: redactRecord(server.env),
        headers: redactRecord(server.headers),
        ...(server.oauth?.clientSecret
            ? {
                oauth: {
                    ...server.oauth,
                    clientSecret: REDACTED_MCP_SECRET,
                },
            }
            : {}),
    };
}
export function restoreRedactedMcpSecrets(server, existing) {
    const existingOauth = recordOf(existing['oauth']);
    const incomingSecret = server.oauth?.clientSecret;
    const restoredSecret = incomingSecret === REDACTED_MCP_SECRET
        ? existingOauth['clientSecret']
        : incomingSecret;
    return {
        ...server,
        env: restoreRecord(server.env, existing['env']),
        headers: restoreRecord(server.headers, existing['headers']),
        ...(server.oauth
            ? {
                oauth: {
                    ...server.oauth,
                    ...(typeof restoredSecret === 'string'
                        ? { clientSecret: restoredSecret }
                        : { clientSecret: undefined }),
                },
            }
            : {}),
    };
}
export function redactMcpServersSetting(value) {
    const servers = recordOf(value);
    return Object.fromEntries(Object.entries(servers).map(([name, server]) => {
        const record = recordOf(server);
        return [name, redactMcpServerSecrets(record)];
    }));
}
export function restoreRedactedMcpServersSetting(value, existing) {
    const servers = recordOf(value);
    const existingServers = recordOf(existing);
    return Object.fromEntries(Object.entries(servers).map(([name, server]) => {
        const record = recordOf(server);
        return [
            name,
            restoreRedactedMcpSecrets(record, recordOf(existingServers[name])),
        ];
    }));
}
//# sourceMappingURL=mcp-server-secrets.js.map