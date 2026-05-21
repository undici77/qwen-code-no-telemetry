/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Jupyter Notebook cell output types.
 */
export interface NotebookCellOutput {
    output_type: 'stream' | 'execute_result' | 'display_data' | 'error';
    text?: string | string[];
    data?: Record<string, unknown>;
    ename?: string;
    evalue?: string;
    traceback?: string[];
}
/**
 * Jupyter Notebook cell.
 */
export type NotebookCellType = 'code' | 'markdown' | 'raw';
export type EditableNotebookCellType = 'code' | 'markdown';
export interface NotebookCell {
    cell_type: NotebookCellType;
    source: string | string[];
    metadata?: Record<string, unknown>;
    outputs?: NotebookCellOutput[];
    execution_count?: number | null;
    id?: string;
}
/**
 * Jupyter Notebook top-level structure.
 */
export interface NotebookContent {
    cells: NotebookCell[];
    metadata?: {
        language_info?: {
            name?: string;
        };
        kernelspec?: {
            language?: string;
            display_name?: string;
        };
        [key: string]: unknown;
    };
    nbformat?: number;
    nbformat_minor?: number;
}
export interface NotebookReadResult {
    content: string;
    isTruncated: boolean;
}
export interface NotebookJsonFormat {
    indent?: number;
    trailingNewline: boolean;
}
export declare function normalizeSource(source: string | string[]): string;
export declare function parseNotebook(content: string): NotebookContent;
export declare function inferNotebookJsonFormat(content: string): NotebookJsonFormat;
export declare function serializeNotebook(notebook: NotebookContent, format?: NotebookJsonFormat): string;
export declare function parseCellId(cellId: string): number | undefined;
export declare function getCellDisplayId(cell: NotebookCell, index: number): string;
export declare function hasStableCellIds(notebook: NotebookContent): boolean;
export declare function findCellIndexesByDisplayId(notebook: NotebookContent, cellId: string): number[];
export declare function isAmbiguousCellId(notebook: NotebookContent, cellId: string): boolean;
export declare function findCellIndex(notebook: NotebookContent, cellId: string): number;
export declare function getNotebookLanguage(notebook: NotebookContent): string;
export declare function shouldGenerateCellIds(notebook: NotebookContent): boolean;
export declare function makeCellId(notebook: NotebookContent): string | undefined;
export declare function inferNotebookSourceArrayStyle(notebook: NotebookContent): boolean;
export declare function inferInsertedCellSourceArrayStyle(notebook: NotebookContent, insertAt: number): boolean;
export declare function toNotebookSource(source: string, preferArray: boolean): string | string[];
export declare function normalizeEditedCell(cell: NotebookCell, finalType: NotebookCellType): void;
/**
 * Read and parse a Jupyter notebook file (.ipynb) into a structured text
 * representation, plus whether the cell listing was truncated.
 */
export declare function readNotebookWithMetadata(filePath: string): Promise<NotebookReadResult>;
/**
 * Read and parse a Jupyter notebook file (.ipynb) into a structured text
 * representation. Returns a formatted string with all cells and their outputs.
 */
export declare function readNotebook(filePath: string): Promise<string>;
