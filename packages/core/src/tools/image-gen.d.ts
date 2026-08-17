/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type GenerateImage } from '../services/image-generation-service.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
export interface ImageGenParams {
  prompt: string;
  size?: string;
}
export declare class ImageGenTool extends BaseDeclarativeTool<
  ImageGenParams,
  ToolResult
> {
  private readonly config;
  private readonly generateImage;
  static readonly Name: 'image_gen';
  constructor(config: Config, generateImage?: GenerateImage);
  protected validateToolParamValues(params: ImageGenParams): string | null;
  protected createInvocation(
    params: ImageGenParams,
  ): ToolInvocation<ImageGenParams, ToolResult>;
}
