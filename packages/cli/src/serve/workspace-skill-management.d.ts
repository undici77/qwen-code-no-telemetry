export type WorkspaceSkillScope = 'workspace' | 'global';
export type WorkspaceSkillInstallSource =
  | {
      type: 'github';
      url: string;
    }
  | {
      type: 'folder';
      path: string;
    }
  | {
      type: 'zip';
      contentBase64: string;
    };
export interface WorkspaceSkillInstallRequest {
  name: string;
  scope: WorkspaceSkillScope;
  source: WorkspaceSkillInstallSource;
}
export interface WorkspaceSkillMutationResult {
  skillName: string;
  scope: WorkspaceSkillScope;
  installedPath?: string;
  deleted?: boolean;
}
export declare const MAX_WORKSPACE_SKILL_NAME_LENGTH = 256;
export declare class WorkspaceSkillManagementError extends Error {
  readonly code: string;
  readonly statusCode: number;
  constructor(code: string, message: string, statusCode?: number);
}
export declare function validateWorkspaceSkillName(name: string): string;
export declare function installWorkspaceSkill(
  workspace: string,
  request: WorkspaceSkillInstallRequest,
  githubToken?: string,
  assertGenerationOpen?: () => void,
): Promise<WorkspaceSkillMutationResult>;
export declare function deleteWorkspaceSkill(
  workspace: string,
  scope: WorkspaceSkillScope,
  skillNameInput: string,
  installedPath: string,
  assertGenerationOpen?: () => void,
): Promise<WorkspaceSkillMutationResult>;
