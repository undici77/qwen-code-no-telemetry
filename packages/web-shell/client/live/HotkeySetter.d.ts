/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type KeyboardEvent } from 'react';
export declare function acceleratorFromKeyboardEvent(
  event: KeyboardEvent<HTMLInputElement>,
): string | null;
export declare function formatAccelerator(accelerator: string): string;
export declare function HotkeySetter({
  accelerator,
  disabled,
  captureLabel,
  clearLabel,
  offLabel,
  onChange,
}: {
  accelerator: string;
  disabled: boolean;
  captureLabel: string;
  clearLabel: string;
  offLabel: string;
  onChange: (accelerator: string) => Promise<void>;
}): import('react/jsx-runtime').JSX.Element;
