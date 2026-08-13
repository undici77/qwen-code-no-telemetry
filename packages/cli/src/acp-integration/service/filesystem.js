/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { RequestError } from '@agentclientprotocol/sdk';
import { createDebugLogger, getErrorMessage, isSubpath, } from '@qwen-code/qwen-code-core';
import { buildToolWriteOriginMeta } from '@qwen-code/qwen-code-core/toolWriteOrigin';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
const RESOURCE_NOT_FOUND_CODE = -32002;
const PATH_OUTSIDE_WORKSPACE_KIND = 'path_outside_workspace';
const SYMLINK_ESCAPE_KIND = 'symlink_escape';
const LOCAL_READ_FALLBACK_ERROR_KINDS = new Set([
    PATH_OUTSIDE_WORKSPACE_KIND,
    SYMLINK_ESCAPE_KIND,
]);
const debugLogger = createDebugLogger('ACP_FILE_SYSTEM');
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function getErrorCode(error) {
    if (error instanceof RequestError) {
        return error.code;
    }
    if (isRecord(error)) {
        return error['code'];
    }
    return undefined;
}
function getErrorData(error) {
    const data = isRecord(error) ? error['data'] : undefined;
    return isRecord(data) ? data : undefined;
}
function getErrorKind(error) {
    const data = getErrorData(error);
    if (data && typeof data['errorKind'] === 'string') {
        return data['errorKind'];
    }
    return undefined;
}
function normalizeError(error) {
    if (error instanceof Error)
        return error;
    return new Error(getErrorMessage(error), {
        cause: error,
    });
}
function createEnoentError(filePath) {
    const err = new Error(`File not found: ${filePath}`);
    err.code = 'ENOENT';
    err.errno = -2;
    err.path = filePath;
    return err;
}
function isLocalReadFallbackErrorKind(errorKind) {
    return (typeof errorKind === 'string' &&
        LOCAL_READ_FALLBACK_ERROR_KINDS.has(errorKind));
}
async function resolveRealPath(value) {
    if (!value.trim())
        return undefined;
    try {
        return await realpath(path.resolve(value));
    }
    catch (error) {
        if (getErrorCode(error) !== 'ENOENT') {
            debugLogger.warn('realpath failed during ACP local read fallback check', {
                path: value,
                error: getErrorMessage(error),
            });
        }
        return undefined;
    }
}
function toAcpReadTextFileRequest(params, sessionId) {
    // `maxOutputBytes`, `signal`, and `stats` are core-local concerns that the
    // current ACP schema cannot represent. Keep this boundary explicit if the
    // schema grows.
    const request = {
        path: params.path,
        sessionId,
    };
    if (params._meta !== undefined) {
        request._meta = params._meta;
    }
    if (params.limit !== undefined) {
        request.limit = params.limit;
    }
    if (params.line != null) {
        request.line = params.line + 1;
    }
    return request;
}
export class AcpFileSystemService {
    connection;
    sessionId;
    capabilities;
    fallback;
    options;
    constructor(connection, sessionId, capabilities, fallback, options = {}) {
        this.connection = connection;
        this.sessionId = sessionId;
        this.capabilities = capabilities;
        this.fallback = fallback;
        this.options = options;
    }
    async readTextFile(params) {
        if (!this.capabilities.readTextFile) {
            return this.fallback.readTextFile(params);
        }
        // Everything below — including the localReadRoots retry in the catch — is
        // unreachable under `qwen serve`, which advertises this capability as
        // false. It guards only generic ACP hosts that keep delegation on. Do not
        // read the retry as a live backstop for daemon reads.
        let response;
        try {
            response = await this.connection.readTextFile(toAcpReadTextFileRequest(params, this.sessionId));
        }
        catch (error) {
            const errorCode = getErrorCode(error);
            if (errorCode === RESOURCE_NOT_FOUND_CODE) {
                throw createEnoentError(params.path);
            }
            const errorKind = getErrorKind(error);
            const shouldTryLocalReadFallback = isLocalReadFallbackErrorKind(errorKind);
            const fallbackPath = shouldTryLocalReadFallback
                ? await this.getLocalReadFallbackPath(params.path)
                : undefined;
            if (shouldTryLocalReadFallback && !fallbackPath) {
                debugLogger.debug('Local read fallback skipped - no safe local path', {
                    path: params.path,
                    errorKind,
                });
            }
            if (shouldTryLocalReadFallback && fallbackPath) {
                debugLogger.debug('Falling back to local read after ACP error', {
                    path: params.path,
                    resolvedPath: fallbackPath,
                    errorKind,
                    error: getErrorMessage(error),
                });
                try {
                    return await this.fallback.readTextFile({
                        ...params,
                        path: fallbackPath,
                    });
                }
                catch (fallbackError) {
                    if (getErrorCode(fallbackError) === 'ENOENT') {
                        throw fallbackError;
                    }
                    debugLogger.warn('Local read fallback failed after ACP error', {
                        path: params.path,
                        resolvedPath: fallbackPath,
                        errorKind,
                        originalError: getErrorMessage(error),
                        fallbackError: getErrorMessage(fallbackError),
                    });
                    throw new Error(`Local fallback read failed for ${params.path}: ${getErrorMessage(fallbackError)} (original ACP error: ${getErrorMessage(error)})`, { cause: { fallbackError, acpError: error } });
                }
            }
            throw normalizeError(error);
        }
        return response;
    }
    async writeTextFile(params) {
        if (!this.capabilities.writeTextFile) {
            return this.fallback.writeTextFile(params);
        }
        const { toolWriteOrigin, _meta: requestMeta, ...wireParams } = params;
        const finalContent = requestMeta?.['bom'] && params.content.charCodeAt(0) !== 0xfeff
            ? '\uFEFF' + params.content
            : params.content;
        const wireMeta = buildToolWriteOriginMeta(requestMeta, toolWriteOrigin);
        try {
            await this.connection.writeTextFile({
                ...wireParams,
                content: finalContent,
                ...(wireMeta !== undefined ? { _meta: wireMeta } : {}),
                sessionId: this.sessionId,
            });
        }
        catch (error) {
            if (getErrorCode(error) === RESOURCE_NOT_FOUND_CODE) {
                throw createEnoentError(params.path);
            }
            throw normalizeError(error);
        }
        return { _meta: params._meta };
    }
    findFiles(fileName, searchPaths) {
        return this.fallback.findFiles(fileName, searchPaths);
    }
    async getResolvedLocalReadRoots() {
        const roots = await Promise.all((this.options.localReadRoots ?? []).map(resolveRealPath));
        return roots.filter((root) => Boolean(root));
    }
    async getLocalReadFallbackPath(filePath) {
        const normalizedFilePath = path.resolve(filePath);
        const realFilePath = await resolveRealPath(normalizedFilePath);
        if (!realFilePath)
            return undefined;
        for (const realRoot of await this.getResolvedLocalReadRoots()) {
            if (isSubpath(realRoot, realFilePath)) {
                return realFilePath;
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=filesystem.js.map