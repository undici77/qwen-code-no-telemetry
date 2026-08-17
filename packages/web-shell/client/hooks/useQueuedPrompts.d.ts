/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type DaemonSessionActions,
  type DaemonStreamingState,
} from '@qwen-code/webui/daemon-react-sdk';
import type {
  DaemonInputAnnotation,
  DaemonTranscriptStore,
} from '@qwen-code/sdk/daemon';
import type { PromptImage } from '../adapters/promptTypes';
import type { EditorHandle } from './useComposerCore';
import type { getTranslator } from '../i18n';
import type { QueuedPrompt } from '../components/QueuedPromptDisplay';
interface RefBox<T> {
  current: T;
}
interface UseQueuedPromptsArgs {
  connected: boolean;
  writeBlocked?: boolean;
  sessionId?: string;
  workspaceCwd?: string;
  clientId?: string;
  /**
   * Whether the daemon advertises `session_mid_turn_message_mutation`. Gates the
   * mid-turn delete/edit mutations — including the keyboard path, which the view
   * layer's hidden buttons can't reach — so an older daemon that mints message
   * ids without the route isn't sent a DELETE it answers with a 404.
   */
  canMutateMidTurn: boolean;
  /**
   * Whether the daemon advertises `session_mid_turn_message_query`. Gates the
   * daemon-owned queue lifecycle. With it, accepted messages are restored and
   * reconciled by id across drain or idle promotion; without it the hook keeps
   * the legacy local fallback used by older daemons.
   */
  canQueryMidTurn: boolean;
  streamingState: DaemonStreamingState;
  sessionActions: DaemonSessionActions;
  store: DaemonTranscriptStore;
  editorRef: RefBox<EditorHandle | null>;
  reportError: (error: unknown, fallback: string) => void;
  t: ReturnType<typeof getTranslator>;
}
/**
 * Merge a restored prompt's text into the editor content. Restoration paths
 * (failed submits, failed mid-turn inserts, queue clears) prepend the prompt
 * above whatever the user is currently typing — but several of them can fire
 * for the same prompt across reconnects/refreshes, and a user retrying an
 * identical message produces the same text twice. Stacking those copies is
 * what #7128 reports as "inputs concatenated after refresh", so restoring
 * text that is already present at the top of the editor is a no-op.
 */
export declare function mergeRestoredPromptText(
  current: string,
  text: string,
): string;
export interface UseQueuedPromptsResult {
  queuedPrompts: QueuedPrompt[];
  queuedTexts: string[];
  enqueuePrompt: (
    text: string,
    images?: PromptImage[],
    onComplete?: () => void,
    inputAnnotations?: DaemonInputAnnotation[],
    onAdmitted?: () => void,
  ) => boolean;
  removeQueuedPrompt: (id: number) => void;
  editQueuedPrompt: (id: number) => Promise<void>;
  editLastQueuedPrompt: () => boolean;
  clearQueuedPrompts: () => boolean;
  restoreUnknownQueuedPrompt: (id: number) => boolean;
  discardUnknownQueuedPrompt: (id: number) => boolean;
}
export declare function useQueuedPrompts({
  connected,
  writeBlocked,
  sessionId,
  workspaceCwd,
  clientId,
  canMutateMidTurn,
  canQueryMidTurn,
  streamingState,
  sessionActions,
  store,
  editorRef,
  reportError,
  t,
}: UseQueuedPromptsArgs): UseQueuedPromptsResult;
export {};
