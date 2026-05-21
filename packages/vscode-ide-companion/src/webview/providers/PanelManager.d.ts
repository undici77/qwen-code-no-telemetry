/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
export declare function getLocalResourceRoots(extensionUri: vscode.Uri, workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): vscode.Uri[];
/**
 * Panel and Tab Manager
 * Responsible for managing the creation, display, and tab tracking of WebView Panels
 */
export declare class PanelManager {
    private extensionUri;
    private onPanelDispose;
    private panel;
    private panelTab;
    private panelGroupViewColumn;
    constructor(extensionUri: vscode.Uri, onPanelDispose: () => void);
    /**
     * Get the current Panel
     */
    getPanel(): vscode.WebviewPanel | null;
    /**
     * Set Panel (for restoration)
     */
    setPanel(panel: vscode.WebviewPanel): void;
    /**
     * Create new WebView Panel
     * @returns Whether it is a newly created Panel
     */
    createPanel(): Promise<boolean>;
    /**
     * Find the group and view column where the existing Qwen Code webview is located
     * @returns The found group and view column, or undefined if not found
     */
    private findExistingQwenCodeGroup;
    /**
     * Auto-lock editor group (only called when creating a new Panel)
     * After creating/revealing the WebviewPanel, lock the active editor group so
     * the group stays dedicated (users can still unlock manually). We still
     * temporarily unlock before creation to allow adding tabs to an existing
     * group; this method restores the locked state afterwards.
     */
    autoLockEditorGroup(): Promise<void>;
    /**
     * Show Panel (reveal if exists, otherwise do nothing)
     * @param preserveFocus Whether to preserve focus
     */
    revealPanel(preserveFocus?: boolean): void;
    /**
     * Capture the Tab corresponding to the WebView Panel
     * Used for tracking and managing Tab state
     */
    captureTab(): void;
    /**
     * Register the dispose event handler for the Panel
     * @param disposables Array used to store Disposable objects
     */
    registerDisposeHandler(disposables: vscode.Disposable[]): void;
    /**
     * Focus the editor group at the given view column by stepping left/right.
     * This avoids depending on Nth-group focus commands that may not exist.
     */
    private focusGroupByColumn;
    /**
     * Register the view state change event handler
     * @param disposables Array used to store Disposable objects
     */
    registerViewStateChangeHandler(disposables: vscode.Disposable[]): void;
    /**
     * Dispose Panel
     */
    dispose(): void;
}
