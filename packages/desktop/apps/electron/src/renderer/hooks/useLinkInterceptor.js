/**
 * useLinkInterceptor - Centralized hook for intercepting file/URL open requests.
 *
 * Replaces the old handleOpenFile/handleOpenUrl in App.tsx that always opened externally.
 * Now classifies file types and decides whether to show an in-app preview overlay
 * or fall back to opening in the default external application.
 *
 * Architecture:
 *   Markdown click → PlatformContext → App.tsx → useLinkInterceptor
 *     ├── canPreview? → set previewState (renders overlay in App.tsx)
 *     └── can't preview? → electronAPI.openFile (opens externally)
 *
 * Uses refs for options to keep returned callbacks referentially stable,
 * preventing unnecessary re-renders of consumers (AppShellContext, PlatformProvider).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { classifyFile } from '@craft-agent/ui';
import { getLanguageFromPath } from '@/lib/file-utils';
// ── Hook implementation ────────────────────────────────────────────────────────
export function useLinkInterceptor(options) {
    const [previewState, setPreviewState] = useState(null);
    // Use refs for options so callbacks remain referentially stable.
    // Without this, every render creates a new options object → new callbacks → cascading
    // re-renders of AppShellContext and PlatformProvider consumers.
    const optionsRef = useRef(options);
    useEffect(() => { optionsRef.current = options; }, [options]);
    // Also track previewState in a ref for the openCurrentExternal/revealCurrentInFinder
    // callbacks, so they don't need previewState in their dependency array.
    const previewStateRef = useRef(previewState);
    useEffect(() => { previewStateRef.current = previewState; }, [previewState]);
    /**
     * Main entry point for file link clicks.
     * Classifies the file by extension, then either opens a preview overlay
     * or falls back to opening externally.
     *
     * For text-based files (code, markdown, json, text), reads the content BEFORE
     * showing the overlay — local filesystem reads are near-instant, so no loading
     * state is needed. This avoids null-content issues in overlay components
     * (e.g., @uiw/react-json-view crashes on null value).
     */
    const handleOpenFile = useCallback(async (path) => {
        const classification = classifyFile(path);
        if (!classification.canPreview || !classification.type) {
            // No preview available — open in default external app
            optionsRef.current.openFileExternal(path);
            return;
        }
        const type = classification.type;
        // For image/pdf: set state immediately — the overlay handles its own async loading
        if (type === 'image' || type === 'pdf') {
            setPreviewState({ type, filePath: path });
            return;
        }
        // For text-based files: read content first, then show overlay with content ready.
        // Local filesystem reads are near-instant — no loading state needed.
        try {
            const content = await optionsRef.current.readFile(path);
            const state = buildInitialTextState(type, path);
            setPreviewState({ ...state, content });
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to read file';
            const state = buildInitialTextState(type, path);
            setPreviewState({ ...state, content: '', error: errorMsg });
        }
    }, []); // Stable: uses optionsRef
    /** Open file directly in external app, bypassing classification/preview.
     * Used by overlay header badges — when already viewing a file, "Open" should launch the editor. */
    const openFileExternal = useCallback((path) => {
        optionsRef.current.openFileExternal(path);
    }, []); // Stable: uses optionsRef
    /** URLs always open externally — no in-app browser for security */
    const handleOpenUrl = useCallback((url) => {
        optionsRef.current.openUrl(url);
    }, []); // Stable: uses optionsRef
    const closePreview = useCallback(() => {
        setPreviewState(null);
    }, []);
    /** Open the currently previewed file in external app (from overlay header) */
    const openCurrentExternal = useCallback(() => {
        const state = previewStateRef.current;
        if (state) {
            optionsRef.current.openFileExternal(state.filePath);
        }
    }, []); // Stable: uses refs
    /** Reveal the currently previewed file in system file manager (from overlay header) */
    const revealCurrentInFinder = useCallback(() => {
        const state = previewStateRef.current;
        if (state) {
            optionsRef.current.showInFolder(state.filePath);
        }
    }, []); // Stable: uses refs
    /** Stable reference to readFileDataUrl for overlay components */
    const readFileDataUrl = useCallback((path) => {
        return optionsRef.current.readFileDataUrl(path);
    }, []); // Stable: uses optionsRef
    /** Stable reference to readFileBinary for PDF overlay */
    const readFileBinary = useCallback((path) => {
        return optionsRef.current.readFileBinary(path);
    }, []); // Stable: uses optionsRef
    return {
        handleOpenFile,
        handleOpenUrl,
        openFileExternal,
        previewState,
        closePreview,
        openCurrentExternal,
        revealCurrentInFinder,
        readFileDataUrl,
        readFileBinary,
    };
}
// ── Helpers ────────────────────────────────────────────────────────────────────
/**
 * Build the initial preview state for text-based file types.
 * Content is null initially (loading), and gets populated after async read.
 */
function buildInitialTextState(type, path) {
    switch (type) {
        case 'code':
            return { type: 'code', filePath: path, content: null, language: getLanguageFromPath(path) };
        case 'markdown':
            return { type: 'markdown', filePath: path, content: null };
        case 'json':
            return { type: 'json', filePath: path, content: null };
        case 'text':
            return { type: 'text', filePath: path, content: null };
        default:
            // Should never happen — image/pdf are handled before this function is called
            return { type: 'text', filePath: path, content: null };
    }
}
//# sourceMappingURL=useLinkInterceptor.js.map