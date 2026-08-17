/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type ChannelSecretUpdate =
  | {
      operation: 'preserve';
    }
  | {
      operation: 'replace';
      value: string;
    }
  | {
      operation: 'clear';
    };
export interface ChannelSettingsSnapshot {
  revision: string;
  channels: Record<string, Record<string, unknown>>;
  startupNames: string[];
}
export interface ChannelSettingsMutationOptions {
  expectedRevision: string;
}
export interface ChannelSettingsUpsertOptions
  extends ChannelSettingsMutationOptions {
  config: Record<string, unknown> & {
    type: string;
  };
  secrets?: Record<string, ChannelSecretUpdate>;
}
export declare class ChannelSettingsError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}
export declare function assertValidChannelSecretUpdates(
  updates: unknown,
): asserts updates is Record<string, ChannelSecretUpdate>;
export declare class WorkspaceChannelSettingsStore {
  private readonly workspaceCwd;
  constructor(workspaceCwd: string);
  snapshot(): ChannelSettingsSnapshot;
  upsert(
    name: string,
    options: ChannelSettingsUpsertOptions,
  ): Promise<ChannelSettingsSnapshot>;
  remove(
    name: string,
    options: ChannelSettingsMutationOptions,
  ): Promise<ChannelSettingsSnapshot>;
  setStartupNames(
    names: readonly string[],
    options: ChannelSettingsMutationOptions,
  ): Promise<ChannelSettingsSnapshot>;
  private assertRevision;
}
