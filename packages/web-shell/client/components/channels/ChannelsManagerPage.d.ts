/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Ref } from 'react';
interface ChannelsManagerPageProps {
  onClose: () => void;
  initialFocusRef?: Ref<HTMLHeadingElement>;
}
export declare function ChannelsManagerPage({
  onClose,
  initialFocusRef,
}: ChannelsManagerPageProps): import('react/jsx-runtime').JSX.Element;
export {};
