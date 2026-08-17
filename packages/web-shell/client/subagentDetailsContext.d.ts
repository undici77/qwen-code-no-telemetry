import { type ReactNode } from 'react';
import type { ACPToolCall } from './adapters/types';
export type OpenSubagentDetails = (tool: ACPToolCall) => void;
interface SubagentDetailsContextValue {
  onOpen: OpenSubagentDetails;
}
export declare function SubagentDetailsProvider({
  onOpen,
  children,
}: {
  onOpen: OpenSubagentDetails;
  children: ReactNode;
}): import('react/jsx-runtime').JSX.Element;
export declare function useSubagentDetails():
  | SubagentDetailsContextValue
  | undefined;
export {};
