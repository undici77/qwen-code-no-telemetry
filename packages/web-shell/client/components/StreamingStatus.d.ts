interface StreamingStatusProps {
  startedAt?: number;
  /**
   * When false, hide the rotating "witty" loading phrase and skip its rotation
   * timer entirely — the spinner, elapsed time, token count, and cancel hint
   * still render. Split-view panes pass false to keep each pane's composer
   * status compact. Defaults to true (the main chat shows the phrase).
   */
  showPhrase?: boolean;
}
export declare function StreamingStatus({
  startedAt,
  showPhrase,
}: StreamingStatusProps): import('react/jsx-runtime').JSX.Element | null;
export {};
