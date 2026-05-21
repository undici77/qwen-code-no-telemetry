/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { UpdateInfo } from 'update-notifier';
export declare const FETCH_TIMEOUT_MS = 2000;
export interface UpdateObject {
    message: string;
    update: UpdateInfo;
}
export declare function checkForUpdates(): Promise<UpdateObject | null>;
