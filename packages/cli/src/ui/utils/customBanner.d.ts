/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings } from '../../config/settings.js';
export interface ResolvedBanner {
    asciiArt: {
        small?: string;
        large?: string;
    };
    title?: string;
    /**
     * Optional subtitle rendered between the title and the auth/model line.
     * Sanitized like the title (control sequences stripped, newlines folded
     * to spaces). When undefined, `<Header />` keeps the existing blank
     * spacer row for back-compat.
     */
    subtitle?: string;
}
/**
 * Resolve the user's banner customization into the shape `<Header />`
 * expects. Soft-fails on every error path: any malformed input, missing
 * file, oversized file, or sanitization rejection logs a `[BANNER]` warn
 * and falls back to the locked default for that field. The CLI must never
 * crash on a banner config error.
 */
export declare function resolveCustomBanner(settings: LoadedSettings): ResolvedBanner;
/**
 * Shared with `<Header />` so the renderer doesn't reinvent the same width
 * arithmetic. Tries `large` first, then `small`; returns the first tier
 * that fits in the available width, or `undefined` to signal "hide the
 * logo column entirely (fall back to the default Qwen logo or no logo)".
 */
export declare function pickAsciiArtTier(small: string | undefined, large: string | undefined, availableWidth: number, logoGap: number, minInfoPanelWidth: number, measureWidth: (art: string) => number): string | undefined;
