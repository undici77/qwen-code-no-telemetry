/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReactNode } from 'react';
/**
 * Platform types supported by the webui library
 */
export type PlatformType = 'vscode' | 'chrome' | 'web' | 'share';
/**
 * Platform context interface for cross-platform component reuse.
 * Each platform adapter implements this interface.
 */
export interface PlatformContextValue {
    /** Current platform identifier */
    platform: PlatformType;
    /** Send message to platform host */
    postMessage: (message: unknown) => void;
    /** Subscribe to messages from platform host */
    onMessage: (handler: (message: unknown) => void) => () => void;
    /** Open a file in the platform's editor (optional) */
    openFile?: (path: string) => void;
    /** Open a diff view for a file (optional) */
    openDiff?: (path: string, oldText: string | null | undefined, newText: string | undefined) => void;
    /** Open a temporary file with given content (optional) */
    openTempFile?: (content: string, fileName?: string) => void;
    /** Trigger file attachment dialog (optional) */
    attachFile?: () => void;
    /** Trigger platform login flow (optional) */
    login?: () => void;
    /** Copy text to clipboard */
    copyToClipboard?: (text: string) => Promise<void>;
    /** Get resource URL for platform-specific assets (e.g., icons) */
    getResourceUrl?: (resourceName: string) => string | undefined;
    /** Platform-specific feature flags */
    features?: {
        canOpenFile?: boolean;
        canOpenDiff?: boolean;
        canOpenTempFile?: boolean;
        canAttachFile?: boolean;
        canLogin?: boolean;
        canCopy?: boolean;
    };
}
/**
 * Platform context for accessing platform-specific capabilities
 */
export declare const PlatformContext: import("react").Context<PlatformContextValue>;
/**
 * Hook to access platform context
 */
export declare function usePlatform(): PlatformContextValue;
/**
 * Provider component props
 */
export interface PlatformProviderProps {
    children: ReactNode;
    value: PlatformContextValue;
}
/**
 * Platform context provider component
 */
export declare function PlatformProvider({ children, value }: PlatformProviderProps): import("react/jsx-runtime").JSX.Element;
