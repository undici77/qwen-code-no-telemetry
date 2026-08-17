/** Terminal lifecycle event types — exactly one is expected per task. */
export function isTerminalTaskLifecycleType(type) {
  return type === 'completed' || type === 'cancelled' || type === 'failed';
}
//# sourceMappingURL=types.js.map
