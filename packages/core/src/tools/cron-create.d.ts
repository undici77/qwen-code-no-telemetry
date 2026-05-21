/**
 * cron_create tool — creates a new in-session cron job.
 */
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import type { Config } from '../config/config.js';
export interface CronCreateParams {
    cron: string;
    prompt: string;
    recurring?: boolean;
}
export declare class CronCreateTool extends BaseDeclarativeTool<CronCreateParams, ToolResult> {
    private config;
    static readonly Name: "cron_create";
    constructor(config: Config);
    protected createInvocation(params: CronCreateParams): ToolInvocation<CronCreateParams, ToolResult>;
    /**
     * Forward the prompt and cadence to the classifier. The scheduled
     * prompt will be enqueued and executed against the agent at fire-time,
     * so it must go through the same scrutiny as a direct command. Without
     * this override the default projection returns `''` and the classifier
     * sees `cron_create({})` — blind to what the agent will be asked to
     * do in 8 hours.
     */
    toAutoClassifierInput(params: CronCreateParams): Record<string, unknown>;
}
