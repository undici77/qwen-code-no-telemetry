/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'fs/promises';
import path from 'path';
import { DataProcessor } from './DataProcessor.js';
import { TemplateRenderer } from './TemplateRenderer.js';
import { dayKey } from '../dates.js';
import { updateSymlink, Storage } from '@qwen-code/qwen-code-core';
export class StaticInsightGenerator {
    dataProcessor;
    templateRenderer;
    constructor(config) {
        this.dataProcessor = new DataProcessor(config);
        this.templateRenderer = new TemplateRenderer();
    }
    // Ensure the output directory exists
    async ensureOutputDirectory() {
        const outputDir = path.join(Storage.getRuntimeBaseDir(), 'insights');
        await fs.mkdir(outputDir, { recursive: true });
        return outputDir;
    }
    // Generate timestamped filename with collision detection
    async generateOutputPath(outputDir) {
        const now = new Date();
        const date = dayKey(now); // local YYYY-MM-DD, matching the report's date basis
        const time = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
        let outputPath = path.join(outputDir, `insight-${date}.html`);
        // Check if date-only file exists, if so, add timestamp
        try {
            await fs.access(outputPath);
            // File exists, use timestamped version
            outputPath = path.join(outputDir, `insight-${date}-${time}.html`);
        }
        catch {
            // File doesn't exist, use date-only name
        }
        return outputPath;
    }
    async updateInsightSymlink(outputDir, targetPath) {
        const latestPath = path.join(outputDir, 'insight.html');
        await updateSymlink(latestPath, targetPath);
    }
    // Generate the static insight HTML file
    async generateStaticInsight(baseDir, onProgress) {
        // Ensure output directory exists
        const outputDir = await this.ensureOutputDirectory();
        const facetsDir = path.join(outputDir, 'facets');
        await fs.mkdir(facetsDir, { recursive: true });
        // Process data
        const insights = await this.dataProcessor.generateInsights(baseDir, facetsDir, onProgress);
        // Render HTML
        const html = await this.templateRenderer.renderInsightHTML(insights);
        // Generate timestamped output path
        const outputPath = await this.generateOutputPath(outputDir);
        // Write the HTML file
        await fs.writeFile(outputPath, html, 'utf-8');
        await this.updateInsightSymlink(outputDir, outputPath);
        return outputPath;
    }
}
//# sourceMappingURL=StaticInsightGenerator.js.map