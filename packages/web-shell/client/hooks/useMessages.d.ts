import type { DaemonTranscriptBlock } from '@qwen-code/sdk/daemon';
import type { Message } from '../adapters/types';
type Translator = (
  key: string,
  vars?: Record<string, string | number>,
) => string;
export interface BackgroundAgentResolution {
  status: string;
  durationMs?: number;
}
export declare function transcriptBlocksToLocalizedMessages(
  blocks: readonly DaemonTranscriptBlock[],
  t: Translator,
): Message[];
export declare function getBackgroundAgentNotificationKey(
  blocks: readonly DaemonTranscriptBlock[],
): string;
export declare function getPendingBackgroundAgentKey(
  messages: readonly Message[],
): string;
export declare function reconcileBackgroundAgentResolutions(
  messages: Message[],
  resolutions: ReadonlyMap<string, BackgroundAgentResolution>,
): Message[];
export declare function useMessagesFromBlocks(
  t: Translator,
  blocks: readonly DaemonTranscriptBlock[],
): Message[];
export declare function useMessages(t: Translator): Message[];
export {};
