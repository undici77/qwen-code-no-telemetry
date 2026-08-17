import type { ReactNode } from 'react';
import type { DaemonSessionGroupColor } from '@qwen-code/sdk/daemon';
export interface SessionGroupSectionProps {
  id: string;
  label: string;
  count: number;
  expanded: boolean;
  color?: DaemonSessionGroupColor;
  children: ReactNode;
  onToggle: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  renameLabel?: string;
  deleteLabel?: string;
  actionsDisabled?: boolean;
}
export declare function SessionGroupSection({
  label,
  count,
  expanded,
  color,
  children,
  onToggle,
  onRename,
  onDelete,
  renameLabel,
  deleteLabel,
  actionsDisabled,
}: SessionGroupSectionProps): import('react/jsx-runtime').JSX.Element;
