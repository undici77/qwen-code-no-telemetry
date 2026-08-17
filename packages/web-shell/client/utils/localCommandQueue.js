/**
 * Append a local command's echo, or suppress it if a turn is streaming.
 *
 * @returns `true` if the command was suppressed — the caller must stop and not
 *   run its inline side effects. `false` if it was appended and the caller
 *   should proceed. Read-only display commands are the deliberate exception:
 *   they ignore the signal and run mid-turn anyway (see the module docstring).
 */
export function appendOrDeferLocalUserMessage(
  isStreaming,
  text,
  _images,
  sink,
) {
  if (isStreaming) {
    return true;
  }
  sink.append(text);
  return false;
}
/**
 * Whether a queued prompt is a slash (`/…`) or shell (`!…`) command rather than
 * model-facing prose.
 *
 * The queue's "insert" action injects the raw text into the running turn via
 * `enqueueMidTurnMessage` — it is NOT re-dispatched as a command, so a command
 * inserted this way reaches the model as the literal string "/context …" and
 * never runs. Callers use this to disable "insert" for command entries that may
 * still exist from daemon/custom command paths or from older sessions.
 */
export function isCommandPrompt(text) {
  const trimmed = text.trimStart();
  return trimmed.startsWith('/') || trimmed.startsWith('!');
}
//# sourceMappingURL=localCommandQueue.js.map
