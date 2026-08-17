import type { DaemonWorkspaceAgentSummary } from '@qwen-code/webui/daemon-react-sdk';
export type AgentLevelFilter = 'all' | DaemonWorkspaceAgentSummary['level'];
export type AgentSelection = Pick<
  DaemonWorkspaceAgentSummary,
  'name' | 'level'
>;
export declare function filterAgents(
  agents: readonly DaemonWorkspaceAgentSummary[],
  query: string,
  level?: AgentLevelFilter,
): DaemonWorkspaceAgentSummary[];
export declare function preserveAgentSelection(
  selection: AgentSelection | null,
  agents: readonly DaemonWorkspaceAgentSummary[],
): DaemonWorkspaceAgentSummary | null;
export declare function isOverridden(
  agent: DaemonWorkspaceAgentSummary,
  allAgents: readonly DaemonWorkspaceAgentSummary[],
): boolean;
export declare function canModifyAgent(
  agent: DaemonWorkspaceAgentSummary,
): boolean;
export declare function scopeForLevel(
  level: string,
): 'workspace' | 'global' | undefined;
