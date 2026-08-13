/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Utility for converting JSON Schemas to be compatible with different LLM providers.
 * Specifically focuses on downgrading modern JSON Schema (Draft 7/2020-12) to
 * OpenAPI 3.0 compatible Schema Objects, which is required for Google Gemini API.
 */
export type SchemaComplianceMode = 'auto' | 'openapi_30';
/**
 * Converts a JSON Schema to be compatible with the specified compliance mode.
 */
export declare function convertSchema(schema: Record<string, unknown>, mode?: SchemaComplianceMode): Record<string, unknown>;
/**
 * Relaxes a tool-parameter JSON Schema for the OpenAI-compatible wire
 * format (#7315).
 *
 * OpenAI's structured-output contract requires that when an object schema
 * carries `additionalProperties: false`, every property must be listed in
 * `required`; several OpenAI-compatible gateways enforce this server-side
 * by silently promoting ALL properties to required. For tools with
 * genuinely optional fields the model is then forced to emit every field
 * on every call — the Agent tool's mutually exclusive `working_dir` and
 * `isolation` become impossible to satisfy, and the model loops on the
 * client-side validation error until loop detection kills the run.
 *
 * The relaxation is deliberately surgical:
 * - `additionalProperties: false` is removed ONLY on object levels that
 *   declare optional properties (some `properties` key missing from
 *   `required`). Levels where every property is required keep the
 *   constraint — there is nothing for a gateway to promote.
 * - `$schema` / `$id` metadata is dropped at every level (some gateways
 *   reject unknown keywords).
 * - Everything else passes through untouched; client-side
 *   `validateToolParams` still enforces the full source schema, so the
 *   constraint is relaxed on the wire only.
 *
 * Pure: returns new objects, never mutates the input.
 */
export declare function relaxSchemaForFunctionCalling(schema: Record<string, unknown>): Record<string, unknown>;
