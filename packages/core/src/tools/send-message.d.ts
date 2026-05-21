/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview SendMessage tool — lets the model send a text message to
 * a background task. Running tasks receive the message at the next tool-round
 * boundary; paused recovered tasks are resumed first and take the message as
 * their first continuation instruction.
 */
import type { Config } from '../config/config.js';
import { BaseDeclarativeTool, type ToolInvocation, type ToolResult } from './tools.js';
export interface SendMessageParams {
    /** The ID of the background task to send the message to. */
    task_id: string;
    /** The text message to deliver to the task. */
    message: string;
}
export declare class SendMessageTool extends BaseDeclarativeTool<SendMessageParams, ToolResult> {
    private readonly config;
    static readonly Name: "send_message";
    constructor(config: Config);
    protected createInvocation(params: SendMessageParams): ToolInvocation<SendMessageParams, ToolResult>;
    /**
     * Forward both fields verbatim to the classifier — `task_id` identifies
     * the privileged sink and the `message` itself is the new instruction
     * the background task will execute, so the classifier needs the full
     * text to evaluate the action's safety.
     */
    toAutoClassifierInput(params: SendMessageParams): Record<string, unknown>;
}
