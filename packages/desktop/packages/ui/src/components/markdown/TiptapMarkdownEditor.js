import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from './extensions/AnimatedTaskItem';
import { Mathematics } from '@tiptap/extension-mathematics';
import Image from '@tiptap/extension-image';
import FileHandler from '@tiptap/extension-file-handler';
import { Markdown as OfficialMarkdown } from '@tiptap/markdown';
import { Markdown as LegacyMarkdown } from 'tiptap-markdown';
import { tiptapCodeBlock } from './TiptapCodeBlockView';
import { TiptapBubbleMenus, INLINE_MATH_EDIT_EVENT } from './TiptapBubbleMenus';
import { TiptapSlashMenu } from './TiptapSlashMenu';
import { MermaidBlock } from './extensions/MermaidBlock';
import { LatexBlock } from './extensions/LatexBlock';
import { RichBlockInteractions } from './extensions/RichBlockInteractions';
import { cn } from '../../lib/utils';
import 'katex/dist/katex.min.css';
import './tiptap-editor.css';
import './extensions/animated-task-item.css';
function getLegacyMarkdown(editor) {
    return editor.storage.markdown?.getMarkdown?.() ?? '';
}
function getOfficialMarkdown(editor) {
    return editor.getMarkdown?.() ?? '';
}
function forceShikiDecorations(editor) {
    try {
        if (editor?.isDestroyed)
            return;
        const tr = editor.view?.state.tr.setMeta('shikiPluginForceDecoration', true);
        if (tr) {
            editor.view?.dispatch(tr);
        }
    }
    catch {
        // Best-effort refresh only.
    }
}
function scheduleShikiRefresh(editor) {
    forceShikiDecorations(editor);
    for (const delay of [80, 220, 450]) {
        setTimeout(() => {
            forceShikiDecorations(editor);
        }, delay);
    }
}
const INLINE_DOUBLE_DOLLAR_REGEX = /\$\$([^\n]+?)\$\$/g;
// Currency marker used during official parse to avoid accidental math tokenization.
const CURRENCY_MARKER = '¤';
const CURRENCY_RANGE_REGEX = /\$(\d[\dA-Za-z.,]*\s*[–-]\s*)\$(\d[\dA-Za-z.,]*)/g;
const CURRENCY_AMOUNT_REGEX = /\$(\d[\dA-Za-z.,]*)/g;
/**
 * Normalize markdown for official TipTap parser:
 * - Keep product policy: users write math with $$...$$
 * - Convert same-line $$...$$ to inline $...$ (TipTap inline math)
 * - Escape currency-like dollars ($100, $2M...) so they don't become inline math nodes
 */
export function preprocessMarkdownForOfficial(markdown) {
    let index = 0;
    const placeholders = new Map();
    const withPlaceholders = markdown.replace(INLINE_DOUBLE_DOLLAR_REGEX, (_, latex) => {
        const key = `@@CA_INLINE_MATH_${index++}@@`;
        placeholders.set(key, latex);
        return key;
    });
    const rangeProtected = withPlaceholders.replace(CURRENCY_RANGE_REGEX, (_match, left, right) => `${CURRENCY_MARKER}${left}${CURRENCY_MARKER}${right}`);
    const amountProtected = rangeProtected.replace(CURRENCY_AMOUNT_REGEX, (_match, amount) => `${CURRENCY_MARKER}${amount}`);
    return amountProtected.replace(/@@CA_INLINE_MATH_\d+@@/g, (key) => {
        const latex = placeholders.get(key) ?? '';
        return `$${latex}$`;
    });
}
/** Undo parser-safety escaping in serialized markdown. */
export function postprocessMarkdownFromOfficial(markdown) {
    return markdown.replaceAll(CURRENCY_MARKER, '$');
}
const MERMAID_FILE_EXTENSIONS = new Set(['mmd', 'mermaid']);
const MERMAID_DIAGRAM_PREFIXES = [
    'graph ',
    'flowchart ',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'erDiagram',
    'journey',
    'gantt',
    'pie',
    'mindmap',
    'timeline',
];
export function isMermaidFilename(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    return ext != null && MERMAID_FILE_EXTENSIONS.has(ext);
}
export function extractMermaidSource(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return null;
    const fenced = trimmed.match(/^```mermaid\s*\n([\s\S]*?)\n```$/i);
    if (fenced?.[1]) {
        const source = fenced[1].trim();
        return source.length > 0 ? source : null;
    }
    const lines = trimmed.split('\n');
    const firstMeaningful = lines
        .map(line => line.trim())
        .find((line) => line.length > 0 && !line.startsWith('%%'));
    if (!firstMeaningful)
        return null;
    const looksLikeMermaid = MERMAID_DIAGRAM_PREFIXES.some(prefix => firstMeaningful.startsWith(prefix));
    return looksLikeMermaid ? trimmed : null;
}
async function readFileAsDataUrl(file) {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string')
                resolve(result);
            else
                reject(new Error('Failed to read file as data URL'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
async function readImageDimensions(src) {
    return await new Promise((resolve) => {
        const image = new globalThis.Image();
        image.onload = () => {
            if (!image.naturalWidth || !image.naturalHeight) {
                resolve(null);
                return;
            }
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
}
function insertMermaidBlock(editor, source, pos) {
    const payload = {
        type: 'mermaidBlock',
        attrs: { code: source },
    };
    const chain = editor.chain().focus();
    if (typeof pos === 'number')
        chain.setTextSelection(pos);
    chain.insertContent(payload).run();
}
function insertImageNode(editor, src, pos, dimensions) {
    const chain = editor.chain().focus();
    if (typeof pos === 'number')
        chain.setTextSelection(pos);
    chain.setImage({
        src,
        ...(dimensions?.width && dimensions?.height
            ? { width: dimensions.width, height: dimensions.height }
            : {}),
    }).run();
}
async function handleDroppedOrPastedFiles(editor, files, pos) {
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const src = await readFileAsDataUrl(file);
            const dimensions = await readImageDimensions(src);
            insertImageNode(editor, src, pos, dimensions);
            continue;
        }
        if (!isMermaidFilename(file.name))
            continue;
        const text = await file.text();
        const source = extractMermaidSource(text) ?? text.trim();
        if (!source)
            continue;
        insertMermaidBlock(editor, source, pos);
    }
}
export function TiptapMarkdownEditor({ content, onUpdate, placeholder = 'Write something...', className, editable = true, markdownEngine = 'legacy', }) {
    const onUpdateRef = React.useRef(onUpdate);
    onUpdateRef.current = onUpdate;
    // Ref for the editor instance — used by the Mathematics onClick callback
    // which is created at extension-configure time (before useEditor returns).
    const editorRef = React.useRef(null);
    const useOfficialMarkdown = markdownEngine === 'official';
    const extensions = React.useMemo(() => {
        const base = [
            StarterKit.configure({
                codeBlock: false,
                heading: { levels: [1, 2, 3] },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            tiptapCodeBlock.configure({
                themes: { light: 'github-light', dark: 'github-dark' },
            }),
            MermaidBlock,
            LatexBlock,
            Placeholder.configure({ placeholder }),
            Image.configure({
                inline: false,
                allowBase64: true,
            }),
            FileHandler.configure({
                onPaste: async (editor, files) => {
                    if (!editable || files.length === 0)
                        return;
                    await handleDroppedOrPastedFiles(editor, files);
                },
                onDrop: async (editor, files, pos) => {
                    if (!editable || files.length === 0)
                        return;
                    await handleDroppedOrPastedFiles(editor, files, pos);
                },
            }),
            RichBlockInteractions,
            ...(editable ? [TiptapSlashMenu] : []),
        ];
        if (useOfficialMarkdown) {
            return [
                ...base,
                Mathematics.configure({
                    inlineOptions: {
                        onClick: (_node, pos) => {
                            const e = editorRef.current;
                            if (!e)
                                return;
                            e.chain().focus().setNodeSelection(pos).run();
                            // Emit after selection so BubbleMenu mounts, then the event activates the input
                            queueMicrotask(() => e.emit(INLINE_MATH_EDIT_EVENT));
                        },
                    },
                    katexOptions: {
                        throwOnError: false,
                        strict: false,
                    },
                }),
                OfficialMarkdown.configure({
                    markedOptions: {
                        gfm: true,
                    },
                }),
            ];
        }
        return [
            ...base,
            LegacyMarkdown.configure({
                html: false,
                transformPastedText: true,
                transformCopiedText: true,
            }),
        ];
    }, [placeholder, useOfficialMarkdown]);
    const initialContent = useOfficialMarkdown
        ? preprocessMarkdownForOfficial(content)
        : content;
    const editor = useEditor({
        extensions,
        content: initialContent,
        ...(useOfficialMarkdown ? { contentType: 'markdown' } : {}),
        editable,
        editorProps: {
            attributes: {
                class: 'tiptap-prose outline-none',
            },
            handlePaste: (_view, event) => {
                if (!editable)
                    return false;
                if (event.clipboardData?.files?.length)
                    return false;
                const text = event.clipboardData?.getData('text/plain') ?? '';
                const source = extractMermaidSource(text);
                if (!source)
                    return false;
                const activeEditor = editorRef.current;
                if (!activeEditor)
                    return false;
                insertMermaidBlock(activeEditor, source);
                return true;
            },
            handleDrop: (view, event) => {
                if (!editable)
                    return false;
                if (event.dataTransfer?.files?.length)
                    return false;
                const text = event.dataTransfer?.getData('text/plain') ?? '';
                const source = extractMermaidSource(text);
                if (!source)
                    return false;
                const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                const activeEditor = editorRef.current;
                if (!activeEditor)
                    return false;
                insertMermaidBlock(activeEditor, source, pos);
                return true;
            },
        },
        onCreate: ({ editor }) => {
            queueMicrotask(() => {
                scheduleShikiRefresh(editor);
            });
        },
        onUpdate: ({ editor }) => {
            const md = useOfficialMarkdown
                ? postprocessMarkdownFromOfficial(getOfficialMarkdown(editor))
                : getLegacyMarkdown(editor);
            onUpdateRef.current?.(md);
        },
    }, [useOfficialMarkdown, extensions]);
    // Keep editorRef in sync for the Mathematics onClick callback
    editorRef.current = editor;
    // Sync editable prop
    React.useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);
    // Sync content when the selected task changes (key prop handles this,
    // but as a safety net for direct content prop changes)
    const prevContentRef = React.useRef(content);
    React.useEffect(() => {
        if (editor && content !== prevContentRef.current) {
            prevContentRef.current = content;
            // Important: when this editor is currently focused, treat incoming content as
            // local controlled echo and avoid setContent resets that can collapse transient
            // block states (e.g. slash-inserted code blocks) and jump selection.
            if (editor.isFocused)
                return;
            const currentMd = useOfficialMarkdown
                ? postprocessMarkdownFromOfficial(getOfficialMarkdown(editor))
                : getLegacyMarkdown(editor);
            if (currentMd !== content) {
                if (useOfficialMarkdown) {
                    const normalized = preprocessMarkdownForOfficial(content);
                    editor.commands.setContent(normalized, { contentType: 'markdown' });
                }
                else {
                    editor.commands.setContent(content);
                }
                queueMicrotask(() => {
                    if (!editor.isDestroyed) {
                        scheduleShikiRefresh(editor);
                    }
                });
            }
        }
    }, [editor, content, useOfficialMarkdown]);
    return (_jsxs("div", { className: cn('tiptap-editor', className), children: [_jsx(EditorContent, { editor: editor }), editor && editable && _jsx(TiptapBubbleMenus, { editor: editor })] }));
}
//# sourceMappingURL=TiptapMarkdownEditor.js.map