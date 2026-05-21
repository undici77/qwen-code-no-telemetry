/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const DEFAULT_CONTEXT_FILENAME = "QWEN.md";
export declare const AGENT_CONTEXT_FILENAME = "AGENTS.md";
export declare const MEMORY_SECTION_HEADER = "## Qwen Added Memories";
export declare function setGeminiMdFilename(newFilename: string | string[]): void;
export declare function getCurrentGeminiMdFilename(): string;
export declare function getAllGeminiMdFilenames(): string[];
