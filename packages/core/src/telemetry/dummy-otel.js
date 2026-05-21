/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Dummy constants and types for OpenTelemetry
export var SpanStatusCode;
(function (SpanStatusCode) {
    SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
    SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
    SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));
export var ValueType;
(function (ValueType) {
    ValueType[ValueType["INT"] = 0] = "INT";
    ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
})(ValueType || (ValueType = {}));
export var TraceFlags;
(function (TraceFlags) {
    TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
    TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));
export var SpanKind;
(function (SpanKind) {
    SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
    SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
    SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
    SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
    SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));
export const ROOT_CONTEXT = {
    setValue: (key, _value) => ({
        ...ROOT_CONTEXT,
        [key]: _value,
        setValue: (k, v) => ROOT_CONTEXT.setValue(k, v),
        getValue: (k) => (k === key ? _value : undefined),
    }),
    getValue: (_key) => undefined,
};
export const context = {
    active: () => ROOT_CONTEXT,
    with: (_ctx, fn) => fn(),
    bind: (_ctx, fn) => fn,
    getSpan: (_ctx) => undefined,
    setSpan: (ctx, _span) => ctx,
    deleteSpan: (ctx) => ctx,
};
export function createContextKey(name) {
    return name;
}
export const trace = {
    getSpan: (_ctx) => undefined,
    getActiveSpan: () => undefined,
    setSpan: (ctx, _span) => ctx,
    deleteSpan: (ctx) => ctx,
    wrapSpanContext: (spanContext) => ({
        spanContext: () => spanContext,
    }),
    getTracer: (_name, _version) => ({
        startSpan: (_name, _options, _context) => ({
            end: () => { },
            setStatus: () => { },
            setAttribute: () => { },
            setAttributes: () => { },
            addEvent: () => { },
            recordException: () => { },
            isRecording: () => false,
            spanContext: () => ({
                traceId: '00000000000000000000000000000000',
                spanId: '0000000000000000',
                traceFlags: TraceFlags.NONE,
            }),
        }),
        startActiveSpan: (_name, _options, _context, fn) => {
            const actualFn = typeof _options === 'function'
                ? _options
                : typeof _context === 'function'
                    ? _context
                    : fn;
            return actualFn({
                end: () => { },
                setStatus: () => { },
                setAttribute: () => { },
                setAttributes: () => { },
                addEvent: () => { },
                recordException: () => { },
                isRecording: () => false,
                spanContext: () => ({
                    traceId: '00000000000000000000000000000000',
                    spanId: '0000000000000000',
                    traceFlags: TraceFlags.NONE,
                }),
            });
        },
    }),
};
export const diag = {
    error: (..._args) => { },
    warn: (..._args) => { },
    info: (..._args) => { },
    debug: (..._args) => { },
    setLogger: () => { },
};
export const SemanticAttributes = {
    HTTP_METHOD: 'http.method',
    HTTP_URL: 'http.url',
    HTTP_STATUS_CODE: 'http.status_code',
};
export const SemanticResourceAttributes = {
    SERVICE_NAME: 'service.name',
    SERVICE_VERSION: 'service.version',
};
//# sourceMappingURL=dummy-otel.js.map