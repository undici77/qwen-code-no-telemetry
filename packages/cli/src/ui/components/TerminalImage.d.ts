/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { Config, TerminalImageDisplay } from '@qwen-code/qwen-code-core';
import type { InlineImageData } from '../types.js';
interface SharedTerminalImageProps {
  contentWidth: number;
  availableTerminalHeight?: number;
}
interface FileTerminalImageProps extends SharedTerminalImageProps {
  data: TerminalImageDisplay;
  config: Config;
}
interface InlineTerminalImageProps extends SharedTerminalImageProps {
  image: InlineImageData;
}
type TerminalImageProps = FileTerminalImageProps | InlineTerminalImageProps;
export declare const TerminalImage: React.FC<TerminalImageProps>;
export {};
