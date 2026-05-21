/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type EditorType = 'vscode' | 'vscodium' | 'windsurf' | 'cursor' | 'vim' | 'neovim' | 'zed' | 'emacs' | 'trae';
export declare function isValidEditorType(editor: string): editor is EditorType;
interface DiffCommand {
    command: string;
    args: string[];
}
export declare function commandExists(cmd: string): boolean;
/**
 * Editor command configurations for different platforms.
 * Each editor can have multiple possible command names, listed in order of preference.
 */
export declare const editorCommands: Record<EditorType, {
    win32: string[];
    default: string[];
}>;
/**
 * Get the executable command for a given editor type.
 * Resolves both CLI commands and platform-specific fallbacks (e.g., macOS app bundles).
 * This is the shared function used by both getDiffCommand and useLaunchEditor.
 * Returns null if no editor command is found.
 */
export declare function getEditorExecutable(editorType: EditorType): string | null;
export declare function isTerminalEditor(editor: EditorType): boolean;
export interface ExternalEditorCommand {
    command: string;
    args: string[];
    needsShell: boolean;
}
/**
 * Get the command + args to open a single file in an editor for editing.
 * GUI editors get a `--wait` flag so the calling process blocks until close.
 * Returns null if the editor type is invalid or the executable is not found.
 */
export declare function getExternalEditorCommand(editorType: EditorType, filePath: string): ExternalEditorCommand | null;
export declare function checkHasEditorType(editor: EditorType): boolean;
export declare function allowEditorTypeInSandbox(editor: EditorType): boolean;
/**
 * Check if the editor is valid and can be used.
 * Returns false if preferred editor is not set / invalid / not available / not allowed in sandbox.
 */
export declare function isEditorAvailable(editor: string | undefined): boolean;
/**
 * Get the diff command for a specific editor.
 */
export declare function getDiffCommand(oldPath: string, newPath: string, editor: EditorType): DiffCommand | null;
/**
 * Opens a diff tool to compare two files.
 * Terminal-based editors by default blocks parent process until the editor exits.
 * GUI-based editors require args such as "--wait" to block parent process.
 */
export declare function openDiff(oldPath: string, newPath: string, editor: EditorType, onEditorClose: () => void): Promise<void>;
export {};
