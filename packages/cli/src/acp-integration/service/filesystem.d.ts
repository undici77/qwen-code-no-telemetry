/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentSideConnection, FileSystemCapability, WriteTextFileResponse } from '@agentclientprotocol/sdk';
import type { CoreReadTextFileRequest, CoreWriteTextFileRequest, FileSystemService, ReadTextFileResponse } from '@qwen-code/qwen-code-core';
interface AcpFileSystemServiceOptions {
    localReadRoots?: readonly string[];
}
export declare class AcpFileSystemService implements FileSystemService {
    private readonly connection;
    private readonly sessionId;
    private readonly capabilities;
    private readonly fallback;
    private readonly options;
    constructor(connection: AgentSideConnection, sessionId: string, capabilities: FileSystemCapability, fallback: FileSystemService, options?: AcpFileSystemServiceOptions);
    readTextFile(params: CoreReadTextFileRequest): Promise<ReadTextFileResponse>;
    writeTextFile(params: CoreWriteTextFileRequest): Promise<WriteTextFileResponse>;
    findFiles(fileName: string, searchPaths: readonly string[]): string[];
    private getResolvedLocalReadRoots;
    private getLocalReadFallbackPath;
}
export {};
