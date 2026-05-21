/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import AjvPkg, {} from 'ajv';
// Ajv2020 is the documented way to use draft-2020-12: https://ajv.js.org/json-schema.html#draft-2020-12
// eslint-disable-next-line import/no-internal-modules
import Ajv2020Pkg from 'ajv/dist/2020.js';
import * as addFormats from 'ajv-formats';
import { createDebugLogger } from './debugLogger.js';
// Ajv's ESM/CJS interop: use 'any' for compatibility as recommended by Ajv docs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AjvClass = AjvPkg.default || AjvPkg;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv2020Class = Ajv2020Pkg.default || Ajv2020Pkg;
const debugLogger = createDebugLogger('SchemaValidator');
const ajvOptions = {
    // See: https://ajv.js.org/options.html#strict-mode-options
    // strictSchema defaults to true and prevents use of JSON schemas that
    // include unrecognized keywords. The JSON schema spec specifically allows
    // for the use of non-standard keywords and the spec-compliant behavior
    // is to ignore those keywords. Note that setting this to false also
    // allows use of non-standard or custom formats (the unknown format value
    // will be logged but the schema will still be considered valid).
    strictSchema: false,
};
// Draft-07 validator (default)
const ajvDefault = new AjvClass(ajvOptions);
// Draft-2020-12 validator for MCP servers using rmcp
const ajv2020 = new Ajv2020Class(ajvOptions);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFormatsFunc = addFormats.default || addFormats;
addFormatsFunc(ajvDefault);
addFormatsFunc(ajv2020);
// Canonical draft-2020-12 meta-schema URI (used by rmcp MCP servers).
// JSON Schema authors commonly include both `…/schema` and `…/schema#`
// — the trailing `#` is an empty fragment and points at the same
// document. Normalize before comparing so either form selects ajv2020.
const DRAFT_2020_12_SCHEMA = 'https://json-schema.org/draft/2020-12/schema';
function isDraft2020Uri(uri) {
    if (typeof uri !== 'string')
        return false;
    const normalized = uri.endsWith('#') ? uri.slice(0, -1) : uri;
    return normalized === DRAFT_2020_12_SCHEMA;
}
/**
 * Returns the appropriate validator based on schema's $schema field.
 */
function getValidator(schema) {
    if (typeof schema === 'object' &&
        schema !== null &&
        '$schema' in schema &&
        isDraft2020Uri(schema.$schema)) {
        return ajv2020;
    }
    return ajvDefault;
}
/**
 * Simple utility to validate objects against JSON Schemas.
 * Supports both draft-07 (default) and draft-2020-12 schemas.
 */
export class SchemaValidator {
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
    static compileStrict(schema) {
        if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
            return 'schema must be a JSON object';
        }
        // Use a dedicated Ajv with `strictSchema: true` so typos like
        // `propertees` raise instead of being silently ignored. The shared
        // ajvDefault/ajv2020 instances run with `strictSchema: false` so
        // unknown MCP keywords don't break runtime validation — that
        // leniency is wrong for explicit user-supplied schemas where
        // `compileStrict` is exactly the surface meant to surface mistakes.
        //
        // We deliberately do NOT pass `strict: true` (which would also
        // enable `strictRequired`, `strictTypes`, etc): those rules go
        // beyond JSON Schema validity and would reject spec-valid schemas
        // like `{type:'object', required:['x']}` (no matching `properties`)
        // or anything using a custom `format`. Keep typo detection;
        // tolerate the looser-but-still-spec-valid patterns users actually
        // ship in `--json-schema`.
        const strictOptions = {
            strictSchema: true, // catches unknown keywords (typos)
            strictRequired: false, // allow `required` without `properties`
            strictTypes: false, // allow inferred / partial type info
            validateFormats: false, // unknown `format` values don't fail
            allowUnionTypes: true, // type: ["a","b"]
        };
        const strictAjv = isDraft2020Uri(schema.$schema)
            ? new Ajv2020Class(strictOptions)
            : new AjvClass(strictOptions);
        addFormatsFunc(strictAjv);
        try {
            strictAjv.compile(schema);
            return null;
        }
        catch (error) {
            return error instanceof Error ? error.message : String(error);
        }
    }
    /**
     * Returns null if the data conforms to the schema described by schema (or if schema
     *  is null). Otherwise, returns a string describing the error.
     */
    static validate(schema, data) {
        if (!schema) {
            return null;
        }
        if (typeof data !== 'object' || data === null) {
            return 'Value of params must be an object';
        }
        const anySchema = schema;
        const validator = getValidator(anySchema);
        // Try to compile and validate; skip validation if schema can't be compiled.
        // This handles schemas using JSON Schema versions AJV doesn't support
        // (e.g., draft-2019-09, future versions).
        // This matches LenientJsonSchemaValidator behavior in mcp-client.ts.
        let validate;
        try {
            validate = validator.compile(anySchema);
        }
        catch (error) {
            // Schema compilation failed (unsupported version, invalid $ref, etc.)
            // Skip validation rather than blocking tool usage.
            debugLogger.warn(`Failed to compile schema (${schema?.['$schema'] ?? '<no $schema>'}): ${error instanceof Error ? error.message : String(error)}. ` +
                'Skipping parameter validation.');
            return null;
        }
        let valid = validate(data);
        if (!valid && validate.errors) {
            // Coerce string boolean values ("true"/"false") to actual booleans
            fixBooleanValues(data);
            // Coerce stringified JSON values (arrays/objects) back to their proper types.
            // Some LLMs serialize complex values as strings when the schema uses
            // anyOf/oneOf (e.g., '["url"]' instead of ["url"] for anyOf: [array, null]).
            fixStringifiedJsonValues(data, anySchema);
            valid = validate(data);
            if (!valid && validate.errors) {
                return validator.errorsText(validate.errors, { dataVar: 'params' });
            }
        }
        return null;
    }
}
/**
 * Coerces string boolean values to actual booleans.
 * This handles cases where LLMs return "true"/"false" strings instead of boolean values,
 * which is common with self-hosted LLMs.
 *
 * Converts:
 * - "true", "True", "TRUE" -> true
 * - "false", "False", "FALSE" -> false
 */
/**
 * Returns the set of JSON Schema types that a property accepts,
 * considering `type`, `anyOf`, and `oneOf` keywords.
 */
function getAcceptedTypes(propSchema) {
    const types = new Set();
    if (typeof propSchema['type'] === 'string') {
        types.add(propSchema['type']);
    }
    else if (Array.isArray(propSchema['type'])) {
        for (const t of propSchema['type']) {
            types.add(t);
        }
    }
    for (const keyword of ['anyOf', 'oneOf']) {
        const variants = propSchema[keyword];
        if (Array.isArray(variants)) {
            for (const variant of variants) {
                if (typeof variant['type'] === 'string') {
                    types.add(variant['type']);
                }
                else if (Array.isArray(variant['type'])) {
                    for (const t of variant['type']) {
                        types.add(t);
                    }
                }
            }
        }
    }
    return types.size > 0 ? types : null;
}
/**
 * Coerces stringified JSON values back to their proper types.
 * Some LLMs serialize arrays/objects as JSON strings when the schema uses
 * anyOf/oneOf with mixed types (e.g., `list[str] | None` in Python becomes
 * `anyOf: [{type: "array"}, {type: "null"}]`). The model may return
 * '["url"]' (a string) instead of ["url"] (an actual array).
 *
 * This function parses such strings back to their intended type when:
 * 1. The value is a string starting with `[` or `{`
 * 2. The schema accepts array or object but not string
 * 3. The parsed result matches one of the accepted types
 */
function fixStringifiedJsonValues(data, schema) {
    const properties = schema['properties'];
    if (!properties)
        return;
    for (const key of Object.keys(data)) {
        const value = data[key];
        const propSchema = properties[key];
        if (!propSchema || typeof value !== 'string')
            continue;
        const trimmed = value.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            const accepted = getAcceptedTypes(propSchema);
            if (!accepted)
                continue;
            // Only coerce if the schema does NOT accept string — otherwise the
            // string value may be intentional.
            if (accepted.has('string'))
                continue;
            if (!accepted.has('array') && !accepted.has('object'))
                continue;
            try {
                const parsed = JSON.parse(trimmed);
                const parsedType = Array.isArray(parsed) ? 'array' : typeof parsed;
                if (accepted.has(parsedType)) {
                    data[key] = parsed;
                }
            }
            catch {
                // Not valid JSON — leave the value unchanged
            }
        }
    }
}
function fixBooleanValues(data) {
    for (const key of Object.keys(data)) {
        if (!(key in data))
            continue;
        const value = data[key];
        if (typeof value === 'object' && value !== null) {
            fixBooleanValues(value);
        }
        else if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (lower === 'true') {
                data[key] = true;
            }
            else if (lower === 'false') {
                data[key] = false;
            }
        }
    }
}
//# sourceMappingURL=schemaValidator.js.map