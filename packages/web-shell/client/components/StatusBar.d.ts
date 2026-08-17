import type { DaemonSessionTaskStatus } from '@qwen-code/sdk/daemon';
import { useI18n } from '../i18n';
export interface StatusBarHandle {
  focusTaskPill(): boolean;
}
interface StatusBarProps {
  onSelectMode: () => void;
  /** Open the model picker so the model can be chosen with the mouse. */
  onSelectModel: () => void;
  /** Show the context-usage breakdown, exactly like typing /context. */
  onShowContext: () => void;
  /** Open the settings dialog so settings are reachable with the mouse. */
  onOpenSettings: () => void;
  onOpenTasks?: () => void;
  onReturnToInput?: (text?: string) => void;
  tasks: readonly DaemonSessionTaskStatus[];
  activeGoal?: {
    condition: string;
    setAt: number;
  } | null;
  /** Open the Goals page. When omitted the goal pill stays a plain label. */
  onOpenGoals?: () => void;
  /** Hide the settings gear button (e.g. when /settings is in hiddenSlashCommands). */
  hideSettings?: boolean;
  /** Toggle the keyboard-shortcuts panel (same as typing `?` in the editor). */
  onToggleShortcuts?: () => void;
  /** Hide secondary footer hints/details for the chat composer layout. */
  compact?: boolean;
}
export declare function getTaskPillLabel(
  tasks: readonly DaemonSessionTaskStatus[],
  t: ReturnType<typeof useI18n>['t'],
): string;
export declare const StatusBar: import('react').ForwardRefExoticComponent<
  StatusBarProps & import('react').RefAttributes<StatusBarHandle>
>;
export {};
