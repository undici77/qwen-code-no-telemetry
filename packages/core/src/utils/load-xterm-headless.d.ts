/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Terminal } from '@xterm/headless';
export type XtermHeadlessModule = {
    Terminal: typeof Terminal;
};
export declare function loadXtermHeadless(): Promise<XtermHeadlessModule>;
