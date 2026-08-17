/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const MAX_REGISTERED_WORKSPACES = 25;
export declare class DuplicateWorkspaceInputError extends Error {
  constructor(workspace: string);
}
export declare class NestedWorkspaceInputError extends Error {
  constructor(parent: string, child: string);
}
export declare class MultipleWorkspaceInputError extends Error {
  constructor();
}
export declare class MissingWorkspaceInputError extends Error {
  constructor();
}
export declare function resolveWorkspaceInputs(workspace: unknown): string[];
export declare function resolveSingleWorkspaceInput(workspace: unknown): string;
