/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import { type EditableNotebookCellType, type NotebookCellType } from '../utils/notebook.js';
import type { ModifiableDeclarativeTool, ModifyContext } from './modifiable-tool.js';
export type NotebookEditMode = 'replace' | 'insert' | 'delete';
export interface NotebookEditToolParams {
    notebook_path: string;
    cell_id?: string;
    new_source?: string;
    cell_type?: EditableNotebookCellType;
    edit_mode?: NotebookEditMode;
}
interface NotebookEditResult {
    updatedContent: string;
    editedCellId: string;
    editedCellType?: NotebookCellType;
    language: string;
    mode: NotebookEditMode;
    requiresReadAfterWrite: boolean;
}
export declare function applyNotebookEdit(rawContent: string, params: NotebookEditToolParams): NotebookEditResult;
export declare class NotebookEditTool extends BaseDeclarativeTool<NotebookEditToolParams, ToolResult> implements ModifiableDeclarativeTool<NotebookEditToolParams> {
    private readonly config;
    static readonly Name: "notebook_edit";
    private readonly modifyMetadataByParams;
    private readonly modifyMetadataByKey;
    constructor(config: Config);
    protected validateToolParamValues(params: NotebookEditToolParams): string | null;
    protected createInvocation(params: NotebookEditToolParams): ToolInvocation<NotebookEditToolParams, ToolResult>;
    private getModifyMetadataKey;
    private rememberModifyMetadata;
    private consumeModifyMetadata;
    private removeQueuedModifyMetadata;
    getModifyContext(_abortSignal: AbortSignal): ModifyContext<NotebookEditToolParams>;
}
export {};
