/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { UpdateObject } from '../ui/utils/updateCheck.js';
import type { LoadedSettings } from '../config/settings.js';
import type { HistoryItem } from '../ui/types.js';
import type { spawn } from 'node:child_process';
export declare function handleAutoUpdate(info: UpdateObject | null, settings: LoadedSettings, projectRoot: string, spawnFn?: typeof spawn): import("child_process").ChildProcessWithoutNullStreams | undefined;
export declare function setUpdateHandler(addItem: (item: Omit<HistoryItem, 'id'>, timestamp: number) => void, setUpdateInfo: (info: UpdateObject | null) => void, isIdleRef?: {
    current: boolean;
}): {
    cleanup: () => void;
    flush: () => void;
};
