export function shouldDisableComposerInput({
  catchingUp,
  pendingApproval,
  isPreparingPrompt,
}) {
  return Boolean(catchingUp || pendingApproval || isPreparingPrompt);
}
export function getComposerPlaceholderState({
  catchingUp,
  isPreparingPrompt,
  isStreaming,
}) {
  if (catchingUp) return 'loading';
  if (isPreparingPrompt || isStreaming) return 'processing';
  return 'idle';
}
export function getComposerPlaceholderKey(input) {
  switch (getComposerPlaceholderState(input)) {
    case 'loading':
      return 'common.loading';
    case 'processing':
      return 'editor.processing';
    case 'idle':
      return 'editor.placeholder';
  }
}
export function shouldBlockComposerSubmit({
  connectionStatus,
  hasSession,
  restartSseOnPrompt,
}) {
  if (connectionStatus === 'error') return true;
  return (
    connectionStatus === 'disconnected' && (!restartSseOnPrompt || !hasSession)
  );
}
//# sourceMappingURL=composerInputState.js.map
