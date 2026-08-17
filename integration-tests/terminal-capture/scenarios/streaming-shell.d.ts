/**
 * Demonstrates streaming shell execution output with PTY enabled by default.
 * Tests the render throttle behavior and progress bar handling.
 * Captures multiple screenshots during execution to show real-time output.
 */
declare const _default: {
  name: string;
  spawn: string[];
  terminal: {
    title: string;
    cwd: string;
  };
  flow: {
    type: string;
    streaming: {
      delayMs: number;
      intervalMs: number;
      count: number;
    };
  }[];
};
export default _default;
