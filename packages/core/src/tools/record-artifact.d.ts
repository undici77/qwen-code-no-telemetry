/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  ToolArtifactKind,
  ToolArtifactStorage,
  ToolInvocation,
  ToolResult,
} from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
export interface RecordArtifactParams {
  title: string;
  kind?: ToolArtifactKind;
  storage?: Exclude<ToolArtifactStorage, 'published'>;
  description?: string;
  workspacePath?: string;
  managedId?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  metadata?: Record<string, string | number | boolean | null>;
}
export declare const ARTIFACT_TITLE_MAX_LENGTH = 200;
export declare const ARTIFACT_WORKSPACE_PATH_MAX_LENGTH = 500;
export declare class RecordArtifactTool extends BaseDeclarativeTool<
  RecordArtifactParams,
  ToolResult
> {
  static readonly Name: string;
  constructor();
  protected validateToolParamValues(
    params: RecordArtifactParams,
  ): string | null;
  protected createInvocation(
    params: RecordArtifactParams,
  ): ToolInvocation<RecordArtifactParams, ToolResult>;
}
export declare function hasControlCharacter(
  value: string,
  allowLineWhitespace?: boolean,
): boolean;
export declare function hasUnsafeDisplayPayload(value: string): boolean;
