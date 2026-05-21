/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentBlock } from '@agentclientprotocol/sdk';
import type { ImageAttachment, SavedImageAttachment } from '../../utils/imageSupport.js';
export declare function appendImageReferences(text: string, imageReferences: string[]): string;
export declare function saveImageToFile(base64Data: string, mimeType: string): Promise<string | null>;
export declare function processImageAttachments(text: string, attachments?: ImageAttachment[]): Promise<{
    formattedText: string;
    displayText: string;
    savedImageCount: number;
    promptImages: SavedImageAttachment[];
}>;
export declare function buildPromptBlocks(text: string, images?: SavedImageAttachment[]): ContentBlock[];
export declare function resolveImagePathsForWebview({ paths, workspaceRoots, globalTempDir, existsSync, toWebviewUri, }: {
    paths: string[];
    workspaceRoots: string[];
    globalTempDir: string;
    existsSync: (path: string) => boolean;
    toWebviewUri: (path: string) => string;
}): Array<{
    path: string;
    src: string | null;
}>;
export declare function createImagePathResolver({ workspaceRoots, toWebviewUri, }: {
    workspaceRoots: string[];
    toWebviewUri: (filePath: string) => string;
}): (paths: string[]) => Array<{
    path: string;
    src: string | null;
}>;
