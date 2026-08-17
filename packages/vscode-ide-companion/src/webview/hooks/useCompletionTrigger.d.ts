/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { RefObject } from 'react';
import type { CompletionItem } from '../../types/completionItemTypes.js';
/**
 * Hook to handle @ and / completion triggers in contentEditable
 * Based on vscode-copilot-chat's AttachContextAction
 */
export declare function useCompletionTrigger(
  inputRef: RefObject<HTMLDivElement | null>,
  getCompletionItems: (
    trigger: '@' | '/',
    query: string,
  ) => Promise<CompletionItem[]>,
): {
  isOpen: boolean;
  triggerChar: '@' | '/' | null;
  query: string;
  position: {
    top: number;
    left: number;
  };
  items: CompletionItem[];
  closeCompletion: () => void;
  openCompletion: (
    trigger: '@' | '/',
    query: string,
    position: {
      top: number;
      left: number;
    },
  ) => Promise<void>;
  refreshCompletion: () => Promise<void>;
};
