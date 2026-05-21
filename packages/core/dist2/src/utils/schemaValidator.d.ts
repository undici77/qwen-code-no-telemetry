/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Simple utility to validate objects against JSON Schemas.
 * Supports both draft-07 (default) and draft-2020-12 schemas.
 */
export declare class SchemaValidator {
    /**
     * Strictly compiles a schema. Returns an error message if the schema is
     * malformed or uses unsupported draft/features for our Ajv configuration
     * (see {@link getValidator} — `$schema` selects between draft-07 and
     * draft-2020-12; anything else falls through to draft-07's compiler).
     * Returns null on success. Unlike {@link validate}, this does NOT
     * silently skip on compile failure — callers (e.g. the CLI's
     * `--json-schema` parser) need to surface invalid schemas instead of
     * letting them no-op at runtime.
     */
    static compileStrict(schema: unknown): string | null;
    /**
     * Returns null if the data conforms to the schema described by schema (or if schema
     *  is null). Otherwise, returns a string describing the error.
     */
    static validate(schema: unknown | undefined, data: unknown): string | null;
}
