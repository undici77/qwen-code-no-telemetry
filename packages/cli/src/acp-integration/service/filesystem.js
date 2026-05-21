/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { RequestError } from '@agentclientprotocol/sdk';
const RESOURCE_NOT_FOUND_CODE = -32002;
function getErrorCode(error) {
    if (error instanceof RequestError) {
        return error.code;
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
        return error.code;
    }
    return undefined;
}
function createEnoentError(filePath) {
    const err = new Error(`File not found: ${filePath}`);
    err.code = 'ENOENT';
    err.errno = -2;
    err.path = filePath;
    return err;
}
export class AcpFileSystemService {
    connection;
    sessionId;
    capabilities;
    fallback;
    constructor(connection, sessionId, capabilities, fallback) {
        this.connection = connection;
        this.sessionId = sessionId;
        this.capabilities = capabilities;
        this.fallback = fallback;
    }
    async readTextFile(params) {
        if (!this.capabilities.readTextFile) {
            return this.fallback.readTextFile(params);
        }
        let response;
        try {
            response = await this.connection.readTextFile({
                ...params,
                sessionId: this.sessionId,
            });
        }
        catch (error) {
            const errorCode = getErrorCode(error);
            if (errorCode === RESOURCE_NOT_FOUND_CODE) {
                throw createEnoentError(params.path);
            }
            throw error;
        }
        return response;
    }
    async writeTextFile(params) {
        if (!this.capabilities.writeTextFile) {
            return this.fallback.writeTextFile(params);
        }
        const finalContent = params._meta?.['bom']
            ? '\uFEFF' + params.content
            : params.content;
        await this.connection.writeTextFile({
            ...params,
            content: finalContent,
            sessionId: this.sessionId,
        });
        return { _meta: params._meta };
    }
    findFiles(fileName, searchPaths) {
        return this.fallback.findFiles(fileName, searchPaths);
    }
}
//# sourceMappingURL=filesystem.js.map