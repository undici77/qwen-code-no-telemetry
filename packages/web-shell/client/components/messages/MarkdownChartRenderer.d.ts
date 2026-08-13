import { type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { ChartRendererRegistry, type JsonPrimitive, type JsonValue } from '@datafe-open/markdown-chart';
import { type CreateEChartsRendererOptions } from '@datafe-open/markdown-chart-echarts';
import type { Components } from 'react-markdown';
import type { CodeBlockRenderer, WebShellMarkdownChartCustomization } from '../../customization';
import type { WebShellTheme } from '../../themeContext';
export declare const ECHARTS_FULLDATA_LANGUAGE = "echarts-fulldata";
export type DatasetCell = JsonPrimitive;
export interface EchartsFullDataOption {
    readonly [key: string]: JsonValue | undefined;
}
export interface EchartsInstance {
    setOption(option: EchartsFullDataOption, opts?: {
        readonly notMerge?: boolean;
    }): void;
    resize(): void;
    dispose(): void;
}
export interface EchartsRuntime {
    init(element: HTMLElement, theme?: string): EchartsInstance;
}
export type EchartsRuntimeLoader = () => EchartsRuntime | Promise<EchartsRuntime>;
export interface EchartsFullDataResolvedDataset {
    readonly dimensions: string[];
    readonly source: DatasetCell[][];
}
export interface EchartsFullDataRefMeta {
    readonly dimensions: string[];
    readonly format: 'csv' | 'json';
}
export type EchartsFullDataRefResolver = (ref: string, meta: EchartsFullDataRefMeta) => EchartsFullDataResolvedDataset | Promise<EchartsFullDataResolvedDataset>;
export interface EchartsFullDataBlockProps {
    readonly option?: EchartsFullDataOption;
    readonly parseError?: string;
    readonly isStreaming?: boolean;
    readonly theme: WebShellTheme;
    readonly loadEcharts?: EchartsRuntimeLoader;
}
export interface EchartsFullDataRendererOptions {
    readonly loadEcharts?: EchartsRuntimeLoader;
    readonly resolveDataRef?: EchartsFullDataRefResolver;
}
export declare function createMarkdownChartRegistry(options?: CreateEChartsRendererOptions): ChartRendererRegistry;
export declare const DEFAULT_WEB_SHELL_MARKDOWN_CHART: WebShellMarkdownChartCustomization;
export declare function createWebShellMarkdownChartPre(registry: ChartRendererRegistry, options?: {
    readonly chartClassName?: string;
    readonly chartStyle?: CSSProperties;
}): NonNullable<Components['pre']>;
export declare function WebShellMarkdownChartProvider({ customization, source, streaming, theme, children, }: {
    readonly customization: WebShellMarkdownChartCustomization;
    readonly source: string;
    readonly streaming: boolean;
    readonly theme: WebShellTheme;
    readonly children: ReactNode;
}): ReactElement;
/**
 * @deprecated Configure `markdown.chart.registry` with
 * `createMarkdownChartRegistry` instead.
 */
export declare function createEchartsFullDataRenderer(options?: EchartsFullDataRendererOptions): CodeBlockRenderer;
/**
 * @deprecated Configure `markdown.chart.registry` and emit a Markdown chart
 * fence instead.
 */
export declare function EchartsFullDataBlock({ option, parseError, isStreaming, theme, loadEcharts, }: EchartsFullDataBlockProps): ReactElement;
