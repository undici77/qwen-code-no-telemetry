/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolArtifact, ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import type { ModifiableDeclarativeTool, ModifyContext } from './modifiable-tool.js';
type WorkspaceToolArtifact = ToolArtifact & {
    storage: 'workspace';
    workspacePath: string;
};
/**
 * Parameters for the WriteFile tool
 */
export interface WriteFileToolParams {
    /**
     * The absolute path to the file to write to
     */
    file_path: string;
    /**
     * The content to write to the file
     */
    content: string;
    /**
     * Whether the proposed content was modified by the user.
     */
    modified_by_user?: boolean;
    /**
     * Initially proposed content.
     */
    ai_proposed_content?: string;
}
/**
 * Kept for the cross-package contract test in `workspace-file-read.test.ts`:
 * the daemon's `GET /file` route resolves the `workspacePath` this produces.
 * Delegates to `buildWorkspaceArtifactMetadata` so the two agree by construction.
 */
export declare function buildRecordArtifactReminder(config: Config, filePath: string): string | null;
export declare function buildWorkspaceArtifactMetadata(config: Config, filePath: string, sizeBytes?: number): WorkspaceToolArtifact | null;
/**
 * Implementation of the WriteFile tool logic
 */
export declare class WriteFileTool extends BaseDeclarativeTool<WriteFileToolParams, ToolResult> implements ModifiableDeclarativeTool<WriteFileToolParams> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    protected validateToolParamValues(params: WriteFileToolParams): string | null;
    protected createInvocation(params: WriteFileToolParams): ToolInvocation<WriteFileToolParams, ToolResult>;
    toAutoClassifierInput(params: WriteFileToolParams): Record<string, unknown>;
    getModifyContext(_abortSignal: AbortSignal): ModifyContext<WriteFileToolParams>;
}
export {};
