import type { ReactNode } from 'react';
interface ChatContextHeaderProps {
  content: ReactNode;
  environmentOpen: boolean;
  environmentAvailable: boolean;
  rightPanelOpen: boolean;
  rightPanelAvailable: boolean;
  onToggleEnvironment: () => void;
  onToggleRightPanel: () => void;
}
export declare function ChatContextHeader({
  content,
  environmentOpen,
  environmentAvailable,
  rightPanelOpen,
  rightPanelAvailable,
  onToggleEnvironment,
  onToggleRightPanel,
}: ChatContextHeaderProps): import('react/jsx-runtime').JSX.Element;
export {};
