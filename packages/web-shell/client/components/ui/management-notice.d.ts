import { type ReactNode } from 'react';
export type ManagementNoticeTone = 'error' | 'success' | 'info' | 'progress';
interface ManagementNoticeProps {
  children: ReactNode;
  closeLabel: string;
  noticeKey: string;
  onDismiss: () => void;
  tone: ManagementNoticeTone;
  className?: string;
}
export declare function ManagementNotice({
  children,
  closeLabel,
  noticeKey,
  onDismiss,
  tone,
  className,
}: ManagementNoticeProps): import('react/jsx-runtime').JSX.Element;
export {};
