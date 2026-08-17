import type { Message } from '../adapters/types';
import type { DaemonSessionActions } from '@qwen-code/webui/daemon-react-sdk';
type SuggestionKind = 'btw' | 'new_session' | 'none';
export interface NewSessionSuggestionState {
  suggestion: Exclude<SuggestionKind, 'none'>;
  classifiedInput: string;
  sourceSessionId: string;
}
export interface UseNewSessionSuggestionOptions {
  enabled: boolean;
  messages: Message[];
  sessionId?: string;
  contextUsageRatio: number;
  isRunning: boolean;
  dialogOpen: boolean;
  hasAttachments: boolean | null;
  generateContent?: DaemonSessionActions['generateSessionContent'];
}
export interface UseNewSessionSuggestionReturn {
  suggestion: NewSessionSuggestionState | null;
  updateInput: (inputText: string) => void;
  dismiss: () => void;
  suppress: () => void;
}
export declare function useNewSessionSuggestion({
  enabled,
  messages,
  sessionId,
  contextUsageRatio,
  isRunning,
  dialogOpen,
  hasAttachments,
  generateContent,
}: UseNewSessionSuggestionOptions): UseNewSessionSuggestionReturn;
export {};
