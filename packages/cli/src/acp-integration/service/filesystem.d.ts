/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentSideConnection, FileSystemCapability, ReadTextFileRequest, WriteTextFileRequest, WriteTextFileResponse } from '@agentclientprotocol/sdk';
import type { FileSystemService, ReadTextFileResponse } from '@qwen-code/qwen-code-core';
export declare class AcpFileSystemService implements FileSystemService {
    private readonly connection;
    private readonly sessionId;
    private readonly capabilities;
    private readonly fallback;
    constructor(connection: AgentSideConnection, sessionId: string, capabilities: FileSystemCapability, fallback: FileSystemService);
    readTextFile(params: Omit<ReadTextFileRequest, 'sessionId'>): Promise<ReadTextFileResponse>;
    writeTextFile(params: Omit<WriteTextFileRequest, 'sessionId'>): Promise<WriteTextFileResponse>;
    findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
