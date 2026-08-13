import { type CSSProperties, type ReactNode } from 'react';
export interface EnhancedTableCell {
    key: string;
    content: ReactNode;
    text: string;
    rawText?: string;
    isHeader: boolean;
    textAlign?: CSSProperties['textAlign'];
}
export interface EnhancedTableRow {
    key: string;
    cells: EnhancedTableCell[];
}
export interface EnhancedTableData {
    headers: EnhancedTableCell[];
    rows: EnhancedTableRow[];
    columnCount: number;
}
export declare const MAX_ENHANCED_TABLE_ROWS = 500;
export declare const MAX_ENHANCED_TABLE_COLUMNS = 50;
interface EnhancedMarkdownTableProps {
    children?: ReactNode;
    fallback?: ReactNode;
    toolbarExtra?: ReactNode;
}
export declare function EnhancedMarkdownTable({ children, fallback, toolbarExtra, }: EnhancedMarkdownTableProps): import("react/jsx-runtime").JSX.Element;
export declare function EnhancedTable({ table, toolbarExtra, }: {
    table: EnhancedTableData;
    toolbarExtra?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
