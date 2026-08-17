/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  InsightData,
  InsightProgressCallback,
} from '../types/StaticInsightTypes.js';
import { type Config } from '@qwen-code/qwen-code-core';
export declare class DataProcessor {
  private config;
  constructor(config: Config);
  private formatRecordsForAnalysis;
  private hasUserAndAssistantRecords;
  private analyzeSession;
  private calculateStreaks;
  generateInsights(
    baseDir: string,
    facetsOutputDir?: string,
    onProgress?: InsightProgressCallback,
  ): Promise<InsightData>;
  private aggregateFacetsData;
  private generateQualitativeInsights;
  private prepareCommonPromptData;
  private scanChatFiles;
  private generateMetrics;
  private generateFacets;
}
