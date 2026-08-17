/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Dispatch, SetStateAction } from 'react';
import type {
  DaemonEvent,
  DaemonSessionContextStatus,
  DaemonSessionSupportedCommandsStatus,
  DaemonWorkspaceProvidersStatus,
  DaemonWorkspaceSkillsStatus,
} from '@qwen-code/sdk/daemon';
import type {
  DaemonCommandInfo,
  DaemonConnectionState,
  DaemonModelInfo,
  DaemonReasoningControls,
  DaemonTokenUsage,
} from './types.js';
export declare function mapProviderStatus(
  status: DaemonWorkspaceProvidersStatus | undefined,
  preferredCurrentModel?: string,
): {
  models: DaemonModelInfo[];
  currentModel?: string;
  currentMode?: string;
  contextWindow?: number;
};
export declare function mapSessionContextModels(
  status: DaemonSessionContextStatus | undefined,
):
  | {
      models: DaemonModelInfo[];
      currentModel?: string;
      contextWindow?: number;
    }
  | undefined;
export declare function mapReasoningControls(
  configOptions: unknown,
  fallbackEffort?: string,
): DaemonReasoningControls | undefined;
export declare function mapSessionContextReasoning(
  status: DaemonSessionContextStatus | undefined,
  fallbackEffort?: string,
): DaemonReasoningControls | undefined;
export declare function mapSupportedCommands(
  status: DaemonSessionSupportedCommandsStatus | undefined,
): {
  commands: DaemonCommandInfo[];
  skills: string[];
};
/**
 * Maps the session-less `/workspace/skills` status into slash-command entries.
 *
 * Session creation is deferred until the first prompt, so before any session
 * exists the only way to populate skill-backed slash commands (e.g. `/review`)
 * is this workspace-level status, which the daemon answers from `Config`'s
 * SkillManager without a live session. The shape mirrors the skills portion of
 * {@link mapSupportedCommands} so the deferred bootstrap and the post-attach
 * snapshot stay consistent — except workspace status carries real descriptions
 * and argument hints, which we surface here.
 */
export declare function mapWorkspaceSkills(
  status: DaemonWorkspaceSkillsStatus | undefined,
): {
  commands: DaemonCommandInfo[];
  skills: string[];
};
export declare function mergeCommands(
  ...groups: DaemonCommandInfo[][]
): DaemonCommandInfo[];
export declare function updateConnectionFromDaemonEvent(
  event: DaemonEvent,
  setConnection: Dispatch<SetStateAction<DaemonConnectionState>>,
): void;
export declare function getSessionDisplayName(
  state: Record<string, unknown> | undefined,
): string | undefined;
export declare function getCurrentMode(
  status: DaemonSessionContextStatus | undefined,
): string | undefined;
export declare function getCurrentModel(
  status: DaemonSessionContextStatus | undefined,
): string | undefined;
/**
 * Latest usage token count carried in a replay snapshot, or undefined if
 * no replayed event has one. Token usage is not part of the attach-time
 * status fetches — it only arrives on streaming `session_update` events —
 * so on session load the last usage-bearing replay event is the freshest
 * count available.
 */
export declare function getReplayTokenCount(
  events: readonly DaemonEvent[],
): number | undefined;
export declare function getTokenCountFromUsage(
  usage: DaemonTokenUsage | undefined,
): number | undefined;
export declare function getReplayTokenUsage(
  events: readonly DaemonEvent[],
): DaemonTokenUsage | undefined;
