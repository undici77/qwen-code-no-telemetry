/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
export interface ImagePreviewItem {
    id: string;
    name: string;
    data: string;
}
export interface ImagePreviewProps {
    images: ImagePreviewItem[];
    onRemove: (id: string) => void;
}
export declare const ImagePreview: FC<ImagePreviewProps>;
export interface ImageMessageLike {
    kind: 'image';
    imagePath: string;
    imageSrc?: string;
    imageMissing?: boolean;
}
export interface ImageMessageRendererProps {
    msg: ImageMessageLike;
    imageIndex: number;
}
export declare const ImageMessageRenderer: FC<ImageMessageRendererProps>;
