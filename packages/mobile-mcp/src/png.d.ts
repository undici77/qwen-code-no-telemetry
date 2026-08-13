export interface PngDimensions {
    width: number;
    height: number;
}
export declare class PNG {
    private readonly buffer;
    constructor(buffer: Buffer);
    getDimensions(): PngDimensions;
}
