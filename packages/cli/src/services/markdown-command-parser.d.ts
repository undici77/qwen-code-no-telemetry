/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
/**
 * Defines the Zod schema for a Markdown command definition file.
 * The frontmatter contains optional metadata, and the body is the prompt.
 */
export declare const MarkdownCommandDefSchema: z.ZodObject<{
    frontmatter: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        'argument-hint': z.ZodOptional<z.ZodString>;
        when_to_use: z.ZodOptional<z.ZodString>;
        'disable-model-invocation': z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        description: z.ZodOptional<z.ZodString>;
        'argument-hint': z.ZodOptional<z.ZodString>;
        when_to_use: z.ZodOptional<z.ZodString>;
        'disable-model-invocation': z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        description: z.ZodOptional<z.ZodString>;
        'argument-hint': z.ZodOptional<z.ZodString>;
        when_to_use: z.ZodOptional<z.ZodString>;
        'disable-model-invocation': z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
    prompt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    prompt: string;
    frontmatter?: z.objectOutputType<{
        description: z.ZodOptional<z.ZodString>;
        'argument-hint': z.ZodOptional<z.ZodString>;
        when_to_use: z.ZodOptional<z.ZodString>;
        'disable-model-invocation': z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}, {
    prompt: string;
    frontmatter?: z.objectInputType<{
        description: z.ZodOptional<z.ZodString>;
        'argument-hint': z.ZodOptional<z.ZodString>;
        when_to_use: z.ZodOptional<z.ZodString>;
        'disable-model-invocation': z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}>;
export type MarkdownCommandDef = z.infer<typeof MarkdownCommandDefSchema>;
/**
 * Parses a Markdown command file with optional YAML frontmatter.
 * @param content The file content
 * @returns Parsed command definition with frontmatter and prompt
 */
export declare function parseMarkdownCommand(content: string): MarkdownCommandDef;
