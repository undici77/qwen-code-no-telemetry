/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Dummy constants and types for OpenTelemetry
export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export enum ValueType {
  INT = 0,
  DOUBLE = 1,
}

export enum TraceFlags {
  NONE = 0x0,
  SAMPLED = 0x1,
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

export type Attributes = Record<string, any>;
export type Context = any;
export type Exception = any;
export type Span = any;
export type SpanContext = any;
export type SpanOptions = any;
export type Tracer = any;
export type HrTime = [number, number];

export const ROOT_CONTEXT = {
  setValue: (key: any, _value: any) => ({
    ...ROOT_CONTEXT,
    [key]: _value,
    setValue: (k: any, v: any) => ROOT_CONTEXT.setValue(k, v),
    getValue: (k: any) => (k === key ? _value : undefined),
  }),
  getValue: (_key: any) => undefined,
};

export const context = {
  active: () => ROOT_CONTEXT,
  with: (_ctx: any, fn: any) => fn(),
  bind: (_ctx: any, fn: any) => fn,
  getSpan: (_ctx: any) => undefined,
  setSpan: (ctx: any, _span: any) => ctx,
  deleteSpan: (ctx: any) => ctx,
};

export function createContextKey(name: string) {
  return name;
}

export const trace = {
  getSpan: (_ctx?: any): any => undefined,
  getActiveSpan: (): any => undefined,
  setSpan: (ctx: any, _span: any) => ctx,
  deleteSpan: (ctx: any) => ctx,
  getSpanContext: (_ctx?: any): any => undefined,
  wrapSpanContext: (spanContext: any) => ({
    spanContext: () => spanContext,
  }),
  getTracer: (_name?: string, _version?: string): any => ({
    startSpan: (_name: string, _options?: any, _context?: any) => ({
      end: () => {},
      setStatus: () => {},
      setAttribute: () => {},
      setAttributes: () => {},
      addEvent: () => {},
      recordException: () => {},
      isRecording: () => false,
      spanContext: () => ({
        traceId: '00000000000000000000000000000000',
        spanId: '0000000000000000',
        traceFlags: TraceFlags.NONE,
      }),
    }),
    startActiveSpan: (
      _name: string,
      _options: any,
      _context: any,
      fn?: (span: any) => any,
    ) => {
      const actualFn =
        typeof _options === 'function'
          ? (_options as (span: any) => any)
          : typeof _context === 'function'
            ? (_context as (span: any) => any)
            : (fn as (span: any) => any);
      return actualFn({
        end: () => {},
        setStatus: () => {},
        setAttribute: () => {},
        setAttributes: () => {},
        addEvent: () => {},
        recordException: () => {},
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
  error: (..._args: any[]) => {},
  warn: (..._args: any[]) => {},
  info: (..._args: any[]) => {},
  debug: (..._args: any[]) => {},
  setLogger: () => {},
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

// Type-only exports for SDK interfaces (no-op implementations)
export type LogRecordProcessor = any;
export type ReadableLogRecord = any;
export type SpanExporter = any;
export type ReadableSpan = any;
export type Resource = any;
export const resourceFromAttributes = (_attrs: Record<string, any>): Resource =>
  ({}) as Resource;

export type Counter = any;
export type Histogram = any;
export type Meter = any;
export type ObservableGauge = any;

export const noopMeter: Meter = {
  createCounter: (_name: string, _options?: any): Counter => ({
    add: (_value: number, _attributes?: any) => {},
  }),
  createHistogram: (_name: string, _options?: any): Histogram => ({
    record: (_value: number, _attributes?: any) => {},
  }),
  createObservableGauge: (_name: string, _options?: any): ObservableGauge => ({
    addCallback: (_callback: any) => {},
  }),
  createObservableUpDownCounter: (_name: string, _options?: any): any => ({
    addCallback: (_callback: any) => {},
  }),
  createObservableCounter: (_name: string, _options?: any): any => ({
    addCallback: (_callback: any) => {},
  }),
  addBatchObservableCallback: (_callback: any, _observables: any[]) => {},
  removeBatchObservableCallback: (_callback: any, _observables: any[]) => {},
};

export const propagation = {
  inject: (_ctx: any, _carrier: any) => {},
  extract: (_ctx: any, _carrier: any): any => ROOT_CONTEXT,
};

export const INVALID_TRACEID = '00000000000000000000000000000000';
export function isSpanContextValid(_ctx?: any): boolean {
  return false;
}

export type LogAttributes = Attributes;
export const logs = {
  getLogger: (_name?: string, _version?: string): any => ({
    emit: (_logRecord: any) => {},
  }),
};
