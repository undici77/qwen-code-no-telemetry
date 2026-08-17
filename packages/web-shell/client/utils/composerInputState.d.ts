type ComposerConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';
export type ComposerPlaceholderState = 'idle' | 'loading' | 'processing';
export declare function shouldDisableComposerInput({
  catchingUp,
  pendingApproval,
  isPreparingPrompt,
}: {
  catchingUp: boolean;
  pendingApproval: boolean;
  isPreparingPrompt: boolean;
}): boolean;
export declare function getComposerPlaceholderState({
  catchingUp,
  isPreparingPrompt,
  isStreaming,
}: {
  catchingUp: boolean;
  isPreparingPrompt: boolean;
  isStreaming: boolean;
}): ComposerPlaceholderState;
export declare function getComposerPlaceholderKey(input: {
  catchingUp: boolean;
  isPreparingPrompt: boolean;
  isStreaming: boolean;
}): 'common.loading' | 'editor.processing' | 'editor.placeholder';
export declare function shouldBlockComposerSubmit({
  connectionStatus,
  hasSession,
  restartSseOnPrompt,
}: {
  connectionStatus: ComposerConnectionStatus;
  hasSession: boolean;
  restartSseOnPrompt: boolean;
}): boolean;
export {};
