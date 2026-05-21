/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
interface MermaidDiagramProps {
    source: string;
    sourceCopyCommand: string;
    contentWidth: number;
    isPending: boolean;
    availableTerminalHeight?: number;
}
export declare const MermaidDiagram: React.NamedExoticComponent<MermaidDiagramProps>;
export {};
