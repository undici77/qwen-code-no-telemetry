/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}
export declare enum ValueType {
  INT = 0,
  DOUBLE = 1,
}
export declare enum TraceFlags {
  NONE = 0,
  SAMPLED = 1,
}
export declare enum SpanKind {
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
export declare const ROOT_CONTEXT: {
  setValue: (
    key: any,
    _value: any,
  ) => {
    setValue: (
      k: any,
      v: any,
    ) => {
      setValue: /*elided*/ any;
      getValue: (k: any) => any;
    };
    getValue: (k: any) => any;
  };
  getValue: (_key: any) => undefined;
};
export declare const context: {
  active: () => {
    setValue: (
      key: any,
      _value: any,
    ) => {
      setValue: (
        k: any,
        v: any,
      ) => {
        setValue: /*elided*/ any;
        getValue: (k: any) => any;
      };
      getValue: (k: any) => any;
    };
    getValue: (_key: any) => undefined;
  };
  with: (_ctx: any, fn: any) => any;
  bind: (_ctx: any, fn: any) => any;
  getSpan: (_ctx: any) => undefined;
  setSpan: (ctx: any, _span: any) => any;
  deleteSpan: (ctx: any) => any;
};
export declare function createContextKey(name: string): string;
export declare const trace: {
  getSpan: (_ctx?: any) => any;
  getActiveSpan: () => any;
  setSpan: (ctx: any, _span: any) => any;
  deleteSpan: (ctx: any) => any;
  getSpanContext: (_ctx?: any) => any;
  wrapSpanContext: (spanContext: any) => {
    spanContext: () => any;
  };
  getTracer: (_name?: string, _version?: string) => any;
};
export declare const diag: {
  error: (..._args: any[]) => void;
  warn: (..._args: any[]) => void;
  info: (..._args: any[]) => void;
  debug: (..._args: any[]) => void;
  setLogger: () => void;
};
export declare const SemanticAttributes: {
  HTTP_METHOD: string;
  HTTP_URL: string;
  HTTP_STATUS_CODE: string;
};
export declare const SemanticResourceAttributes: {
  SERVICE_NAME: string;
  SERVICE_VERSION: string;
};
export type LogRecordProcessor = any;
export type ReadableLogRecord = any;
export type SpanExporter = any;
export type ReadableSpan = any;
export type Resource = any;
export declare const resourceFromAttributes: (
  _attrs: Record<string, any>,
) => Resource;
export type Counter = any;
export type Histogram = any;
export type Meter = any;
export type ObservableGauge = any;
export declare const noopMeter: Meter;
export declare const propagation: {
  inject: (_ctx: any, _carrier: any) => void;
  extract: (_ctx: any, _carrier: any) => any;
};
export declare const INVALID_TRACEID = '00000000000000000000000000000000';
export declare function isSpanContextValid(_ctx?: any): boolean;
export type LogRecord = Record<string, any>;
export type LogAttributes = Attributes;
export declare const logs: {
  getLogger: (_name?: string, _version?: string) => any;
};
export declare const metrics: {
  getMeter: (_name?: string, _version?: string, _options?: any) => Meter;
  createMeter: (_name?: string, _version?: string, _options?: any) => Meter;
  setGlobalMeterProvider: (_provider: any) => void;
  getGlobalMeterProvider: () => any;
};
