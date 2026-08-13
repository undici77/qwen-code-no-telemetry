import { type MarkdownTableMode, type MarkdownContentSource } from '../../customization';
interface MarkdownProps {
    content: string;
    source?: MarkdownContentSource;
    /**
     * True while the message is still streaming in. Used to defer expensive,
     * per-chunk rendering (Mermaid diagrams and Shiki syntax highlighting) until
     * the content settles, avoiding flicker and wasted re-tokenization.
     */
    isStreaming?: boolean;
    tableMode?: MarkdownTableMode;
}
export interface ResolvedFenceLanguage {
    /** What the user typed, in its original case, shown in the code-block header. */
    label: string;
    /** Canonical language id (aliases resolved); also used to detect mermaid. */
    lang: string;
    /** A supported Shiki language id, or 'text' when unsupported (no highlight). */
    resolvedLang: string;
}
export declare function resolveFenceLanguage(rawLang: string | undefined): ResolvedFenceLanguage;
export declare function isSafeHref(url: string | undefined): boolean;
export declare function isSafeImageSrc(url: string | undefined): boolean;
/**
 * react-markdown sanitizes every href through `defaultUrlTransform`, which
 * allows only `http(s)`, `irc(s)`, `mailto` and `xmpp` and rewrites everything
 * else to `''`. Without this, `qwen-session://<id>` never reaches
 * {@link MarkdownLink} with its scheme intact, the interception below is dead
 * code, and the link renders as an inert anchor.
 *
 * Letting the scheme through is safe: `MarkdownLink` never puts it in the DOM.
 * It renders `href="#"` and dispatches the id as an event, so nothing navigates
 * to a `qwen-session:` URL — and an unknown scheme is inert in a browser anyway.
 * Every other href keeps the default sanitizer.
 */
export declare function markdownUrlTransform(url: string): string;
export declare const Markdown: import("react").NamedExoticComponent<MarkdownProps>;
export {};
