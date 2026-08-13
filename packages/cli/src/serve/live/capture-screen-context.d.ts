/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, type ToolInvocation, type ToolResult } from '@qwen-code/qwen-code-core';
export declare const CAPTURE_SCREEN_CONTEXT_TOOL_NAME: "capture_screen_context";
export interface ScreenContextCapture {
    appName: string;
    windowTitle?: string;
    accessibilityText: string;
    screenshotPath: string;
}
export type ScreenContextCapturer = () => Promise<ScreenContextCapture>;
export type CaptureScreenContextParams = Record<string, never>;
export declare class CaptureScreenContextTool extends BaseDeclarativeTool<CaptureScreenContextParams, ToolResult> {
    private readonly capture;
    private readonly captureDirectory;
    constructor(capture: ScreenContextCapturer, captureDirectory?: string);
    protected createInvocation(_params: CaptureScreenContextParams): ToolInvocation<CaptureScreenContextParams, ToolResult>;
}
