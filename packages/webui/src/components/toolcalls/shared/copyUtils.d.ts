/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared copy utilities for toolcall components
 */
import type { FC } from 'react';
/**
 * Handle copy to clipboard using platform-specific API with fallback
 * @param text Text to copy
 * @param event Mouse event to stop propagation
 * @param platformCopy Optional platform-specific copy function
 */
export declare const handleCopyToClipboard: (text: string, event: React.MouseEvent, platformCopy?: (text: string) => Promise<void>) => Promise<void>;
/**
 * Copy button component props
 */
interface CopyButtonProps {
    text: string;
}
/**
 * CopyButton - Shared copy button component with Tailwind styles
 * Uses PlatformContext for platform-specific clipboard access with fallback
 * Note: Parent element should have 'group' class for hover effect
 */
export declare const CopyButton: FC<CopyButtonProps>;
export {};
