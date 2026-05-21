import type { InsightData } from './types';
/**
 * Theme configuration for the share card
 */
export type Theme = 'light' | 'dark';
/**
 * A hidden 1200x675 card optimized for Twitter/X sharing.
 * Rendered off-screen; captured by html2canvas when the user clicks "Share as Card".
 */
export declare function ShareCard({ data, theme, }: {
    data: InsightData;
    theme?: Theme;
}): import("react/jsx-runtime").JSX.Element;
