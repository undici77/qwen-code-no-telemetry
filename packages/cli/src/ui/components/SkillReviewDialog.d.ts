/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PendingSkillView } from '../contexts/UIStateContext.js';
export interface SkillReviewDialogProps {
  skills: PendingSkillView[];
  onAccept: (skillName: string) => void;
  onReject: (skillName: string) => void;
  /** Worked through the batch (or nothing to show) — close without deferring. */
  onClose: () => void;
  /** Esc ("decide later") — defer the whole batch so it isn't auto-reopened. */
  onDismiss: () => void;
}
export declare const SkillReviewDialog: ({
  skills,
  onAccept,
  onReject,
  onClose,
  onDismiss,
}: SkillReviewDialogProps) => import('react/jsx-runtime').JSX.Element | null;
