import type {
  DaemonSettingDescriptor,
  DaemonSettingUpdateResult,
  DaemonWorkspaceSettingsStatus,
} from '@qwen-code/webui/daemon-react-sdk';
import { type WebShellLanguage } from '../../i18n';
import type { UseLiveVoiceSetupResult } from '../../live/useLiveVoiceSetup';
import { type WebShellTheme } from '../../themeContext';
import { type ModelManagementProps } from './ModelManagementSection';
type ChatWidthMode = '1000' | 'wide';
interface SettingsMessageProps {
  settingsState: SettingsMessageSettingsState;
  onLanguageChange: (language: WebShellLanguage, scope: Scope) => void;
  onSubDialog: (settingKey: string, scope: Scope) => void;
  onThemeChange: (theme: WebShellTheme) => void;
  chatWidthMode: ChatWidthMode;
  onChatWidthModeChange: (mode: ChatWidthMode) => void;
  /** Model list/add/delete/select, rendered inside the Model category. */
  modelManagement?: ModelManagementProps;
  embedded?: boolean;
}
export interface SettingsMessageSettingsState {
  status: DaemonWorkspaceSettingsStatus | undefined;
  settings: DaemonSettingDescriptor[];
  loading: boolean;
  error: Error | undefined;
  reload: () => Promise<DaemonWorkspaceSettingsStatus | undefined>;
  setValue: (
    scope: 'workspace' | 'user',
    key: string,
    value: unknown,
  ) => Promise<DaemonSettingUpdateResult>;
  liveSetup?: UseLiveVoiceSetupResult;
}
type Scope = 'user' | 'workspace';
type Translator = (
  key: string,
  vars?: Record<string, string | number>,
) => string;
export declare function formatSettingLabel(
  setting: DaemonSettingDescriptor,
  t: Translator,
): string;
export type FlatRow =
  | {
      type: 'header';
      category: string;
    }
  | {
      type: 'setting';
      setting: DaemonSettingDescriptor;
    }
  | {
      type: 'local';
      localKey: 'chatWidth';
    };
export declare function nextSettingIdx(
  rows: FlatRow[],
  current: number,
  dir: 1 | -1,
): number;
export declare function SettingsMessage({
  settingsState,
  onLanguageChange,
  onSubDialog,
  onThemeChange,
  chatWidthMode,
  onChatWidthModeChange,
  modelManagement,
  embedded,
}: SettingsMessageProps): import('react/jsx-runtime').JSX.Element;
export {};
