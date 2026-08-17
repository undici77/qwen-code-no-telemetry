export interface ChartSeries {
  /** Legend label. */
  label: string;
  /** Data points, oldest→newest; shares the x-axis with the other series. */
  values: number[];
  /** CSS color for the line + swatch, e.g. `'var(--primary)'`. Applied as an
   *  SVG `stroke`/`fill` presentation attribute (not an inline style). */
  color: string;
}
interface SvgLineChartProps {
  series: ChartSeries[];
  /** Epoch-ms timestamp per data point, aligned with `values`; drives the
   *  hover tooltip's time line. */
  timestamps?: number[];
  /** Format a y value for the peak label, per-series current value, and hover. */
  format?: (value: number) => string;
  /** Format a bucket timestamp for the hover tooltip header. */
  formatTime?: (t: number) => string;
  /** Start the y-axis at 0 (default) so magnitudes read honestly, vs. auto-min
   *  which exaggerates small wiggles. */
  zeroBased?: boolean;
  /** Accessible description of what the chart shows. */
  ariaLabel?: string;
  /** Localized prefix for the peak-value label (default `'peak'`). */
  peakLabel?: string;
}
/**
 * Dependency-free inline-SVG line chart for the Daemon Status dashboard. Draws
 * one or more equal-length series on a shared, zero-based y-axis, with a hover
 * cursor that reads out each series' value and the bucket time at that point.
 * Kept deliberately small rather than pulling a charting lib into the
 * self-contained, CSP-strict `serve --web` bundle.
 */
export declare function SvgLineChart({
  series,
  timestamps,
  format,
  formatTime,
  zeroBased,
  ariaLabel,
  peakLabel,
}: SvgLineChartProps): import('react/jsx-runtime').JSX.Element;
export {};
