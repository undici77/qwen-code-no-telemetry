/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
/**
 * Readonly file system provider for temporary files
 * Uses custom URI scheme to create readonly documents in VS Code
 */
export declare class ReadonlyFileSystemProvider implements vscode.FileSystemProvider, vscode.Disposable {
    private static readonly scheme;
    private static instance;
    private readonly files;
    private readonly emitter;
    private readonly disposables;
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]>;
    constructor();
    static getScheme(): string;
    /**
     * Get the global singleton instance
     * Returns null if not initialized yet
     */
    static getInstance(): ReadonlyFileSystemProvider | null;
    /**
     * Create a URI for a readonly temporary file (static version)
     */
    static createUri(fileName: string, content: string): vscode.Uri;
    /**
     * Create a URI for a readonly temporary file (instance method)
     */
    createUri(fileName: string, content: string): vscode.Uri;
    /**
     * Set content for a URI
     */
    setContent(uri: vscode.Uri, content: string): void;
    /**
     * Get content for a URI
     */
    getContent(uri: vscode.Uri): string | undefined;
    watch(): vscode.Disposable;
    stat(uri: vscode.Uri): vscode.FileStat;
    readDirectory(): Array<[string, vscode.FileType]>;
    createDirectory(): void;
    readFile(uri: vscode.Uri): Uint8Array;
    writeFile(uri: vscode.Uri, content: Uint8Array, options: {
        create: boolean;
        overwrite: boolean;
    }): void;
    delete(uri: vscode.Uri): void;
    rename(): void;
    /**
     * Clear all cached files
     */
    clear(): void;
    dispose(): void;
}
