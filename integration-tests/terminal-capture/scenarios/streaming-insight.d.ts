/**
 * Demonstrates streaming capture with the /insight command.
 * The insight command analyzes the codebase and streams results,
 * making it ideal for demonstrating streaming capture.
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
      intervalMs: number;
      count: number;
    };
  }[];
};
export default _default;
