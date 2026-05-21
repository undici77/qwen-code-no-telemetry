/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * VSCode Platform Provider - Adapts VSCode API to PlatformContext
 * This allows webui components to work with VSCode's messaging system
 */
import type { FC, ReactNode } from 'react';
/**
 * Props for VSCodePlatformProvider
 */
interface VSCodePlatformProviderProps {
    children: ReactNode;
}
/**
 * VSCodePlatformProvider - Provides platform context for VSCode extension
 *
 * This component bridges the VSCode API with the platform-agnostic webui components.
 * It wraps children with PlatformProvider and provides VSCode-specific implementations.
 */
export declare const VSCodePlatformProvider: FC<VSCodePlatformProviderProps>;
export {};
