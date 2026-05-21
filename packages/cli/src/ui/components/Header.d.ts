/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
/**
 * Auth display type for the Header component.
 * Simplified representation of authentication method shown to users.
 */
export declare enum AuthDisplayType {
    QWEN_OAUTH = "qwen_oauth",
    CODING_PLAN = "coding_plan",
    API_KEY = "api_key",
    UNKNOWN = "unknown"
}
interface HeaderProps {
    /**
     * Width-aware override for the logo column. Each tier is a sanitized
     * ASCII string; the renderer picks `large` when it fits, then `small`,
     * then falls through to the default Qwen logo. Either tier may be
     * omitted: a missing tier simply skips that step.
     */
    customAsciiArt?: {
        small?: string;
        large?: string;
    };
    /**
     * Sanitized replacement for the bold ">_ Qwen Code" title in the info
     * panel. The version suffix is always appended. When undefined or empty
     * the default title is used; the leading `>_` glyph is part of the
     * default brand and is dropped when a custom title is set.
     */
    customBannerTitle?: string;
    /**
     * Sanitized subtitle string rendered between the title and the
     * auth/model line. When undefined the existing blank spacer row is
     * preserved so unset users see the same layout as before.
     */
    customBannerSubtitle?: string;
    version: string;
    authDisplayType?: AuthDisplayType | string;
    model: string;
    workingDirectory: string;
}
export declare const Header: React.FC<HeaderProps>;
export {};
