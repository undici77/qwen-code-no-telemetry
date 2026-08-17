import { ViewPlugin, EditorView } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import type { CommandInfo } from '../adapters/types';
import type { WebShellLanguage } from '../i18n';
export declare function buildInputHighlightDecorations(
  view: EditorView,
  getCommands: () => CommandInfo[],
  getLanguage: () => WebShellLanguage,
): DecorationSet;
export declare function inputHighlight(
  getCommands?: () => CommandInfo[],
  getLanguage?: () => WebShellLanguage,
): ViewPlugin<
  {
    decorations: DecorationSet;
    update(update: ViewUpdate): void;
  },
  undefined
>;
export declare const inputHighlightTheme: import('@codemirror/state').Extension;
