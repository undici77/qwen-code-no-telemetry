/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { InsightProgressCallback } from '../types/StaticInsightTypes.js';
import { type Config } from '@qwen-code/qwen-code-core';
export declare class StaticInsightGenerator {
    private dataProcessor;
    private templateRenderer;
    constructor(config: Config);
    private ensureOutputDirectory;
    private generateOutputPath;
    private updateInsightSymlink;
    generateStaticInsight(baseDir: string, onProgress?: InsightProgressCallback): Promise<string>;
}
