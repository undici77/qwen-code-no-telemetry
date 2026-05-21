/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { DoctorCheckResult } from '../../types.js';
interface DoctorReportProps {
    checks: DoctorCheckResult[];
    summary: {
        pass: number;
        warn: number;
        fail: number;
    };
    width?: number;
}
export declare const DoctorReport: React.FC<DoctorReportProps>;
export {};
