import type { PromptImage } from '../adapters/promptTypes';
export type ImageIngestionRejectionReason =
  | 'unsupported'
  | 'unavailable'
  | 'too-large'
  | 'read-failed';
export interface ImageIngestionRejection {
  name?: string;
  reason: ImageIngestionRejectionReason;
}
interface ImageFileCandidate {
  file: File;
  mediaType: string;
}
export interface ExtractedImageTransfer {
  claimed: boolean;
  candidates: ImageFileCandidate[];
  rejected: ImageIngestionRejection[];
}
export interface ImageIngestionBatchResult {
  accepted: PromptImage[];
  rejected: ImageIngestionRejection[];
}
interface ReaderLifecycle {
  onReaderCreated?: (reader: FileReader) => void;
  onReaderSettled?: (reader: FileReader) => void;
  maxEncodedBytes?: number;
}
export declare const MAX_IMAGE_ATTACHMENT_DATA_BYTES: number;
export declare function normalizeImageMediaType(
  mediaType: string,
  fileName?: string,
): string | undefined;
export declare function hasFileTransferPayload(
  dataTransfer: DataTransfer,
): boolean;
export declare function extractImageTransfer(
  dataTransfer: DataTransfer,
  source: 'paste' | 'drop',
): ExtractedImageTransfer;
export declare function readImageTransfer(
  transfer: ExtractedImageTransfer,
  lifecycle?: ReaderLifecycle,
): Promise<ImageIngestionBatchResult>;
export {};
