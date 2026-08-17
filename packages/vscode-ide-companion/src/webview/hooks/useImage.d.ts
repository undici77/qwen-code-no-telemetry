/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ImageAttachment } from '../../utils/imageSupport.js';
export type { ImageAttachment };
export interface WebViewMessageBase {
  role: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp: number;
  turnIndex?: number;
  fileContext?: {
    fileName: string;
    filePath: string;
    startLine?: number;
    endLine?: number;
  };
}
export interface WebViewImageMessage extends WebViewMessageBase {
  kind: 'image';
  imagePath: string;
  imageSrc?: string;
  imageMissing?: boolean;
}
export type WebViewMessage = WebViewMessageBase | WebViewImageMessage;
export declare function splitMessageContentForImages(content: string): {
  text: string;
  imagePaths: string[];
};
export declare function expandUserMessageWithImages(
  message: WebViewMessageBase,
): {
  messages: WebViewMessage[];
  imagePaths: string[];
};
export declare function applyImageResolution(
  messages: WebViewMessage[],
  resolutions: Map<string, string | null>,
): WebViewMessage[];
export declare function formatFileSize(bytes: number): string;
export declare function useImagePaste({
  onError,
}?: {
  onError?: (error: string) => void;
}): {
  attachedImages: ImageAttachment[];
  handleRemoveImage: (imageId: string) => void;
  clearImages: () => void;
  handlePaste: (event: React.ClipboardEvent | ClipboardEvent) => Promise<void>;
};
export declare function useImageResolution({
  vscode,
}: {
  vscode: {
    postMessage: (message: unknown) => void;
  };
}): {
  materializeMessages: (messages: WebViewMessageBase[]) => WebViewMessage[];
  materializeMessage: (message: WebViewMessageBase) => WebViewMessage[];
  mergeResolvedImages: (
    messages: WebViewMessage[],
    resolved: Array<{
      path: string;
      src?: string | null;
    }>,
  ) => WebViewMessage[];
  clearImageResolutions: () => void;
};
