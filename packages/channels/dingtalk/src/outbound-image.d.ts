export interface ImageMarker {
    start: number;
    end: number;
    path: string;
}
export interface ValidatedImage {
    data: Buffer;
    fileName: string;
    mimeType: string;
}
export declare class DingTalkMediaUploadError extends Error {
    readonly authFailure: boolean;
    constructor(message: string, authFailure: boolean);
}
export declare function findImageMarkers(text: string): ImageMarker[];
export declare function replaceImageMarkers(text: string, markers: readonly ImageMarker[], replacements: readonly string[]): string;
export declare function stripPartialImageMarker(text: string): string;
export declare function sanitizeStreamingImageMarkers(text: string): string;
export declare function readValidatedImage(imagePath: string, options: {
    workspaceDir: string;
    temporaryDir?: string;
}): ValidatedImage;
export declare function uploadDingTalkImage(image: ValidatedImage, accessToken: string): Promise<string>;
