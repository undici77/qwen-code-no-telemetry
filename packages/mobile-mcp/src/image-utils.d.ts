export declare class ImageTransformer {
    private buffer;
    private newWidth;
    private newFormat;
    private jpegOptions;
    constructor(buffer: Buffer);
    resize(width: number): ImageTransformer;
    jpeg(options: {
        quality: number;
    }): ImageTransformer;
    png(): ImageTransformer;
    toBuffer(): Buffer;
    private qualityToSips;
    private toBufferWithSips;
    private toBufferWithImageMagick;
}
export declare class Image {
    private buffer;
    constructor(buffer: Buffer);
    static fromBuffer(buffer: Buffer): Image;
    resize(width: number): ImageTransformer;
    jpeg(options: {
        quality: number;
    }): ImageTransformer;
}
export declare const isSipsInstalled: () => boolean;
export declare const isImageMagickInstalled: () => boolean;
export declare const isScalingAvailable: () => boolean;
