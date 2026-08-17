import { Component, type ErrorInfo, type ReactNode } from 'react';
type FallbackRender = (error: Error, reset: () => void) => ReactNode;
interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Rendered in place of the children once one of them throws. A function form
   * receives the captured error and a `reset` callback that clears the error
   * and re-mounts the children (for an explicit "try again" affordance).
   */
  fallback: ReactNode | FallbackRender;
  /**
   * When any value here changes between renders, the boundary clears its error
   * state and retries. Pass the rendered content's identity (e.g. a message
   * object) so an edited/retried/streamed update recovers on its own instead of
   * staying stuck on the fallback. A stable broken child keeps the fallback and
   * never loops, since unchanged keys never trigger a reset.
   */
  resetKeys?: ReadonlyArray<unknown>;
  /** Identifies the boundary in console diagnostics. */
  label?: string;
}
interface ErrorBoundaryState {
  error: Error | null;
  resetKeys: ReadonlyArray<unknown>;
}
/**
 * Generic React error boundary. web-shell ships as an embeddable component, so
 * a throw in any one subtree (Markdown, KaTeX, Mermaid, a tool panel) must not
 * white-screen the host page. Wrap risky subtrees with this and supply a
 * graceful fallback.
 */
export declare class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState;
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState>;
  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null;
  componentDidCatch(error: Error, info: ErrorInfo): void;
  private readonly reset;
  render(): ReactNode;
}
export {};
