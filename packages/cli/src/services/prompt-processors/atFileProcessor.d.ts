/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandContext } from '../../ui/commands/types.js';
import { type IPromptProcessor, type PromptPipelineContent } from './types.js';
export declare class AtFileProcessor implements IPromptProcessor {
    private readonly commandName?;
    constructor(commandName?: string | undefined);
    process(input: PromptPipelineContent, context: CommandContext): Promise<PromptPipelineContent>;
}
