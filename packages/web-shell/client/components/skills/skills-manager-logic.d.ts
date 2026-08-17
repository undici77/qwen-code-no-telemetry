import type { DaemonWorkspaceSkillStatus } from '@qwen-code/webui/daemon-react-sdk';
export type SkillLevelFilter = 'all' | DaemonWorkspaceSkillStatus['level'];
export type SkillStatusFilter = 'all' | 'enabled' | 'disabled';
export declare function filterSkills(
  skills: readonly DaemonWorkspaceSkillStatus[],
  query: string,
  level?: SkillLevelFilter,
  status?: SkillStatusFilter,
): DaemonWorkspaceSkillStatus[];
export declare function preserveSkillSelection(
  name: string | null,
  skills: readonly DaemonWorkspaceSkillStatus[],
): string | null;
