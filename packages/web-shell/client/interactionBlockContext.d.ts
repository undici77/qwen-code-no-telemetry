export type RegisterInteractionBlocker = () => () => void;
export declare const InteractionBlockContext: import('react').Context<RegisterInteractionBlocker>;
export declare function useInteractionBlocker(): RegisterInteractionBlocker;
