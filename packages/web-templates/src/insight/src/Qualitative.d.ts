import type { InsightData, QualitativeData } from './types';
export declare function AtAGlance({ qualitative }: {
    qualitative: QualitativeData;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function NavToc(): import("react/jsx-runtime").JSX.Element;
export declare function ProjectAreas({ qualitative, topGoals, topTools, }: {
    qualitative: QualitativeData;
    topGoals?: Record<string, number>;
    topTools?: Record<string, number> | Array<[string, number]>;
}): import("react/jsx-runtime").JSX.Element;
export declare function InteractionStyle({ qualitative, insights, }: {
    qualitative: QualitativeData;
    insights: InsightData;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function ImpressiveWorkflows({ qualitative, primarySuccess, outcomes, }: {
    qualitative: QualitativeData;
    primarySuccess: Record<string, number>;
    outcomes: Record<string, number>;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function FrictionPoints({ qualitative, satisfaction, friction, }: {
    qualitative: QualitativeData;
    satisfaction?: Record<string, number>;
    friction?: Record<string, number>;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function Improvements({ qualitative, }: {
    qualitative: QualitativeData;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function FutureOpportunities({ qualitative, }: {
    qualitative: QualitativeData;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function MemorableMoment({ qualitative, }: {
    qualitative: QualitativeData;
}): import("react/jsx-runtime").JSX.Element | null;
