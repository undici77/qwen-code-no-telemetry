/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const IMAGE_CAPABILITY: Readonly<{
  /** Text-only active models are handled by the vision bridge when configured. */
  autoHandlesWrongModel: true;
  /** Current per-image inline base64 payload cap, in bytes. */
  maxBytes: number;
  /**
   * Current max images the bridge will send to the vision model
   * concurrently. Not a per-turn total — every image is eventually
   * converted, just throttled to this many in-flight calls at once.
   */
  maxImagesPerTurn: 4;
}>;
