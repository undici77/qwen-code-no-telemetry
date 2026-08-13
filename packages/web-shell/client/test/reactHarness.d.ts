import { type ReactNode } from 'react';
export declare function mountReact(node: ReactNode): HTMLElement;
export declare function cleanupReact(): void;
export declare function flushReact(): Promise<void>;
export declare function immediateClipboardWrite(): Promise<void>;
