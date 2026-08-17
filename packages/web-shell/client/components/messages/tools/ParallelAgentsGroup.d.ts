import type { ACPToolCall, PermissionRequest } from '../../../adapters/types';
interface ParallelAgentsGroupProps {
  agents: ACPToolCall[];
  autoManageExpansion?: boolean;
  automaticCollapseDelayMs?: number;
  deferAutomaticCollapse?: boolean;
  expandActiveWhenLive?: boolean;
  onAutomaticExpansionChange?: (expanded: boolean) => void;
  pendingApproval?: PermissionRequest | null;
}
export declare function ParallelAgentsGroup({
  agents,
  autoManageExpansion,
  automaticCollapseDelayMs,
  deferAutomaticCollapse,
  expandActiveWhenLive,
  onAutomaticExpansionChange,
  pendingApproval,
}: ParallelAgentsGroupProps): import('react/jsx-runtime').JSX.Element;
export {};
