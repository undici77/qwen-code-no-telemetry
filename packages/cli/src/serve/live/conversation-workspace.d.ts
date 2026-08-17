/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface LiveConversationRootIdentity {
  readonly configuredRoot: string;
  readonly canonicalRoot: string;
  readonly device: number;
  readonly inode: number;
}
export interface LiveConversationWorkspaceOptions {
  homeDir?: string;
}
export declare function getLiveConversationRootPath(homeDir?: string): string;
export declare function revalidateLiveConversationRoot(
  root: LiveConversationRootIdentity,
): Promise<LiveConversationRootIdentity>;
export declare function assertExactLiveConversationRoot(
  root: LiveConversationRootIdentity,
  candidate: string,
): Promise<LiveConversationRootIdentity>;
export declare class LiveConversationWorkspace {
  readonly rootPath: string;
  private rootPromise?;
  constructor(options?: LiveConversationWorkspaceOptions);
  getRoot(): Promise<LiveConversationRootIdentity>;
  revalidate(): Promise<LiveConversationRootIdentity>;
  assertExactRoot(candidate: string): Promise<LiveConversationRootIdentity>;
  materializeConversationDirectory(sessionId: string): Promise<string>;
  discardEmptyConversationDirectory(sessionId: string): Promise<boolean>;
}
