/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionService } from '@qwen-code/qwen-code-core';
export interface SessionPreviewProps {
    sessionService: SessionService;
    sessionId: string;
    sessionTitle?: string;
    /** Message count from the session list entry, for the footer. */
    messageCount?: number;
    /** Last-modified time (ms epoch) from the session list entry, for the footer. */
    mtime?: number;
    /** Git branch from the session list entry, for the footer. */
    gitBranch?: string;
    onExit: () => void;
    onResume: (sessionId: string) => void;
}
export declare function SessionPreview(props: SessionPreviewProps): import("react/jsx-runtime").JSX.Element;
