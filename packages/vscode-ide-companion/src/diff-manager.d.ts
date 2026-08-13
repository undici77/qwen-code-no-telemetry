/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
export declare class DiffContentProvider implements vscode.TextDocumentContentProvider {
    private content;
    private onDidChangeEmitter;
    get onDidChange(): vscode.Event<vscode.Uri>;
    provideTextDocumentContent(uri: vscode.Uri): string;
    setContent(uri: vscode.Uri, content: string): void;
    deleteContent(uri: vscode.Uri): void;
    getContent(uri: vscode.Uri): string | undefined;
}
/**
 * Manages the state and lifecycle of diff views within the IDE.
 */
export declare class DiffManager {
    private readonly log;
    private readonly diffContentProvider;
    private readonly onDidChangeEmitter;
    readonly onDidChange: vscode.Event<JSONRPCNotification>;
    private diffDocuments;
    private readonly subscriptions;
    private recentlyShown;
    private pendingDelayTimers;
    private static readonly DEDUPE_WINDOW_MS;
    private shouldDelay?;
    private shouldSuppress?;
    private suppressUntil;
    constructor(log: (message: string) => void, diffContentProvider: DiffContentProvider, shouldDelay?: () => boolean, shouldSuppress?: () => boolean);
    dispose(): void;
    /**
     * Checks if a diff view already exists for the given file path and content
     * @param filePath Path to the file being diffed
     * @param oldContent The original content (left side)
     * @param newContent The modified content (right side)
     * @returns True if a diff view with the same content already exists, false otherwise
     */
    private hasExistingDiff;
    /**
     * Finds an existing diff view for the given file path and focuses it
     * @param filePath Path to the file being diffed
     * @returns True if an existing diff view was found and focused, false otherwise
     */
    private focusExistingDiff;
    /**
     * Creates and shows a new diff view.
     * - Overload 1: showDiff(filePath, newContent)
     * - Overload 2: showDiff(filePath, oldContent, newContent)
     * If only newContent is provided, the old content will be read from the
     * filesystem (empty string when file does not exist).
     */
    showDiff(filePath: string, newContent: string): Promise<void>;
    showDiff(filePath: string, oldContent: string, newContent: string): Promise<void>;
    /**
     * Closes an open diff view for a specific file.
     */
    closeDiff(filePath: string, suppressNotification?: boolean): Promise<string | undefined>;
    /**
     * User accepts the changes in a diff view. Does not apply changes.
     */
    acceptDiff(rightDocUri: vscode.Uri): Promise<void>;
    /**
     * Called when a user cancels a diff view.
     */
    cancelDiff(rightDocUri: vscode.Uri): Promise<void>;
    private onActiveEditorChange;
    private addDiffDocument;
    private closeDiffEditor;
    /** Close all open qwen-diff editors */
    closeAll(): Promise<void>;
    private readOldContentFromFs;
    private makeKey;
    /** Temporarily suppress opening diffs for a short duration. */
    suppressFor(durationMs: number): void;
}
