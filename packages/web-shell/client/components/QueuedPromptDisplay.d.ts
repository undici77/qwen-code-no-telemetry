/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PromptImage } from '../adapters/promptTypes';
import type { DaemonInputAnnotation } from '@qwen-code/sdk/daemon';
import type { getTranslator } from '../i18n';
export interface QueuedPrompt {
  id: number;
  sessionId?: string;
  text: string;
  images?: PromptImage[];
  inputAnnotations?: DaemonInputAnnotation[];
  onComplete?: () => void;
  onAdmitted?: () => void;
  serverPromptId?: string;
  serverState?: 'submitting' | 'queued' | 'running';
  midTurnState?: 'submitting' | 'queued';
  midTurnMessageId?: string;
  midTurnFailedAction?: 'delete' | 'edit';
  isEditing?: boolean;
  isRemoving?: boolean;
  payloadCompleteness?: 'complete' | 'summary-only';
  admissionOutcome?: 'unknown';
  payloadAvailable?: boolean;
}
export declare function QueuedPromptDisplay({
  prompts,
  t,
  canMutateMidTurn,
  onDelete,
  onEdit,
  onRestoreUnknown,
  onDiscardUnknown,
}: {
  prompts: readonly QueuedPrompt[];
  t: ReturnType<typeof getTranslator>;
  canMutateMidTurn?: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onRestoreUnknown?: (id: number) => void;
  onDiscardUnknown?: (id: number) => void;
}): import('react/jsx-runtime').JSX.Element | null;
