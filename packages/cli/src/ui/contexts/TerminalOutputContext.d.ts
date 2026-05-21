/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC, ReactNode } from 'react';
export type WriteTerminalRaw = (data: string) => void;
export declare const TerminalOutputProvider: FC<{
    value: WriteTerminalRaw;
    children: ReactNode;
}>;
export declare function useTerminalOutput(): WriteTerminalRaw;
