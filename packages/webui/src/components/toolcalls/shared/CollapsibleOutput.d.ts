/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type FC, type ReactNode } from 'react';
interface CollapsibleOutputProps {
  children: ReactNode;
  isCollapsible: boolean;
  collapsedHeight?: number;
  fadeStart?: number;
  className?: string;
}
/**
 * Renderer-agnostic wrapper for long tool output.
 */
export declare const CollapsibleOutput: FC<CollapsibleOutputProps>;
export {};
