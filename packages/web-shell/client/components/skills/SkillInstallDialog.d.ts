import type { DaemonSkillInstallRequest } from '@qwen-code/sdk/daemon';
interface SkillInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (request: DaemonSkillInstallRequest) => Promise<void>;
}
export declare function SkillInstallDialog({
  open,
  onOpenChange,
  onInstall,
}: SkillInstallDialogProps): import('react/jsx-runtime').JSX.Element;
export {};
