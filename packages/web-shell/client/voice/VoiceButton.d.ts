/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import {
  type VoiceStatusRevision,
  type VoiceWorkspaceTarget,
} from './voice-workspace-target';
export interface VoiceButtonProps {
  /** Insert the final transcript into the composer (user reviews, then sends). */
  onInsert: (text: string) => void;
  onActiveChange?: (active: boolean) => void;
  disabled?: boolean;
  target: VoiceWorkspaceTarget | undefined;
  statusRevision?: VoiceStatusRevision;
}
export declare function VoiceButton({
  onInsert,
  onActiveChange,
  disabled,
  target,
  statusRevision,
}: VoiceButtonProps): React.JSX.Element | null;
