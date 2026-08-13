/**
 * Streaming capture for /qc:bugfix command on GitHub issue #2833.
 * This scenario runs a long-running bugfix workflow with screenshots every 30 seconds
 * to capture the full evolution of the debugging process.
 */
declare const _default: {
    name: string;
    spawn: string[];
    terminal: {
        title: string;
        cwd: string;
    };
    gif: true;
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
