declare const _default: {
    name: string;
    spawn: string[];
    terminal: {
        title: string;
        cwd: string;
        cols: number;
        rows: number;
    };
    flow: ({
        type: string;
        streaming: {
            delayMs: number;
            intervalMs: number;
            count: number;
        };
        capture: string;
        captureFull: string;
        key?: undefined;
    } | {
        key: string;
        capture: string;
        captureFull: string;
        type?: undefined;
        streaming?: undefined;
    } | {
        type: string;
        capture: string;
        streaming?: undefined;
        captureFull?: undefined;
        key?: undefined;
    })[];
};
export default _default;
