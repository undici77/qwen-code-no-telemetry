/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part, PartListUnion } from '@google/genai';
/**
 * Normalize a {@link PartListUnion} into a flat array of {@link Part} objects.
 *
 * A `PartListUnion` may be a bare string, a single `Part`, or an array mixing
 * strings and `Part`s. Strings are wrapped as `{ text }` parts so callers can
 * treat the result uniformly.
 *
 * @param input The part list union to normalize.
 * @returns A flat array of `Part` objects (never mutated from the input).
 */
export declare function normalizeParts(input: PartListUnion): Part[];
/**
 * Determine whether a part is an inline image with usable data.
 *
 * Only `inlineData` parts whose MIME type begins with `image/` and that carry
 * non-empty base64 data qualify. This deliberately excludes audio, video, and
 * PDF `inlineData` parts, which also use the same wire shape but are not
 * something an image model can interpret. It also excludes `fileData` image
 * references because the bridge side-query path expects local inline bytes
 * produced by `@` file resolution.
 *
 * @param part The part to inspect.
 * @returns `true` when the part is a usable inline image.
 */
export declare function isImagePart(part: Part): boolean;
/**
 * Report whether a part list contains at least one usable inline image.
 *
 * @param input The part list union to inspect.
 * @returns `true` when any part is a usable inline image.
 */
export declare function hasImageParts(input: PartListUnion): boolean;
/** Result of splitting a part list into image and non-image parts. */
export interface SplitParts {
    /** Inline image parts, in their original order. */
    imageParts: Part[];
    /** Everything that is not a usable inline image (text, tool data, etc.). */
    nonImageParts: Part[];
}
/**
 * Split a part list into image parts and everything else, preserving order.
 *
 * @param input The part list union to split.
 * @returns The image parts and non-image parts as separate arrays.
 */
export declare function splitImageParts(input: PartListUnion): SplitParts;
/**
 * Replace inline image parts with a single text part, preserving order.
 *
 * The first image's slot becomes `{ text }`; any further image parts are
 * dropped. Non-image parts keep their position. This keeps a transcribed
 * description adjacent to the "Content from <file>:" prefix that preceded the
 * image, so the primary model reads it as that file's content instead of seeing
 * an empty header and re-reading the file with a tool. If there is no image
 * part, the text is appended at the end.
 *
 * @param input The original part list (text + inline images).
 * @param text The replacement text to drop into the first image's position.
 * @returns A new flat array of parts with images collapsed into `text`.
 */
export declare function replaceImagesWithText(input: PartListUnion, text: string): Part[];
/**
 * Report whether an image part is safe to send to the bridge model.
 *
 * Guards against empty/corrupt payloads and payloads that exceed the provider
 * size limit. Callers should drop parts that fail so they never attempt a side
 * call that is certain to fail.
 *
 * @param part The image part to check.
 * @returns `true` when the part carries non-empty, within-limit image data.
 */
export declare function isUsableImagePart(part: Part): boolean;
/**
 * Concatenate the text of all non-image parts and trim it.
 *
 * Used both to derive the user's "intent" for the bridge prompt and to decide,
 * on failure, whether there is a real text question worth answering without the
 * image.
 *
 * @param parts The parts to collect text from.
 * @returns The joined, trimmed text (empty string when there is none).
 */
export declare function collectText(parts: Part[]): string;
