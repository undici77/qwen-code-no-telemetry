export function isSessionDisconnectedError(error) {
  return (
    error instanceof Error &&
    error.message.endsWith('Daemon session is not connected')
  );
}
//# sourceMappingURL=sessionErrors.js.map
