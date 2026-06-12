/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonTranscriptBlock, DaemonUiEvent } from './types.js';
export declare function daemonUiEventToTerminalText(event: DaemonUiEvent): string;
export declare function transcriptBlockToTerminalText(block: DaemonTranscriptBlock): string;
