export type DisplayWorkArea = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare function overlayPosition(workArea: DisplayWorkArea, width: number, height: number, margin?: number): {
    x: number;
    y: number;
};
