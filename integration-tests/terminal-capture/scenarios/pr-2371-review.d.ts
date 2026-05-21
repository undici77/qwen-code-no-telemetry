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
            gif: boolean;
        };
    }[];
};
export default _default;
