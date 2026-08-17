import { type ReactNode } from 'react';
import type { ACPToolCall } from './adapters/types';
export type OpenMonitorDetails = (tool: ACPToolCall) => Promise<boolean>;
interface MonitorDetailsContextValue {
  onOpen: OpenMonitorDetails;
}
export declare function MonitorDetailsProvider({
  onOpen,
  children,
}: {
  onOpen: OpenMonitorDetails;
  children: ReactNode;
}): import('react/jsx-runtime').JSX.Element;
export declare function useMonitorDetails():
  | MonitorDetailsContextValue
  | undefined;
export {};
