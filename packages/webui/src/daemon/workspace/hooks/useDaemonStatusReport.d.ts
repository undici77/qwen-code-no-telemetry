/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonStatusReportDetail } from '@qwen-code/sdk/daemon';
import type { DaemonResourceOptions } from '../types.js';
export interface DaemonStatusReportOptions extends DaemonResourceOptions {
    /** Detail level to request; defaults to the cheap `summary` view. */
    detail?: DaemonStatusReportDetail;
}
export declare function useDaemonStatusReport(options?: DaemonStatusReportOptions): {
    report: import("@qwen-code/sdk/daemon").DaemonStatusReport | undefined;
    reload: () => Promise<import("@qwen-code/sdk/daemon").DaemonStatusReport | undefined>;
    data: import("@qwen-code/sdk/daemon").DaemonStatusReport | undefined;
    loading: boolean;
    error: Error | undefined;
};
