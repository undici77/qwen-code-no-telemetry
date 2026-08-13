/**
 * Tests the message component refactoring for PR #2120.
 * Captures info, warning, and error messages to verify proper icon/prefix display.
 *
 * This scenario tests:
 * - Info message prefix (● filled circle)
 * - Error message prefix (✕)
 * - User message prefix (>)
 * - Assistant message prefix (◆)
 */
declare const _default: {
    name: string;
    spawn: string[];
    terminal: {
        title: string;
        cwd: string;
    };
    flow: ({
        type: string;
        streaming?: undefined;
    } | {
        type: string;
        streaming: {
            delayMs: number;
            intervalMs: number;
            count: number;
        };
    })[];
};
export default _default;
