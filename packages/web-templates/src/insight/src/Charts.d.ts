import type { InsightData } from './types';
export declare function DashboardCards({ insights }: {
    insights: InsightData;
}): import("react/jsx-runtime").JSX.Element;
export declare function ActiveHoursChart({ activeHours, cardClass, sectionTitleClass, }: {
    activeHours: Record<number, number>;
    cardClass: string;
    sectionTitleClass: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function HeatmapSection({ heatmap, }: {
    heatmap: Record<string, number>;
}): import("react/jsx-runtime").JSX.Element;
