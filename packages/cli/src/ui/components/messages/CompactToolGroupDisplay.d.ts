/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { IndividualToolCallDisplay } from '../../types.js';
interface CompactToolGroupDisplayProps {
    toolCalls: IndividualToolCallDisplay[];
    contentWidth: number;
    /**
     * Optional LLM-generated label (~30 chars, git-commit-subject style) that
     * replaces the "active tool name + count + description" header when
     * present. Falls back to the default rendering while the label is still
     * being generated or if generation was skipped/failed.
     */
    compactLabel?: string;
}
export declare const CompactToolGroupDisplay: React.FC<CompactToolGroupDisplayProps>;
export {};
