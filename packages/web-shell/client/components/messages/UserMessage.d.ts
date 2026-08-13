import type { DaemonInputAnnotation } from '@qwen-code/sdk/daemon';
import type { ComposerTagClickHandler, ComposerTagRenderer, WebShellComposerTag, WebShellComposerTagIconMap } from '../../customization';
interface UserMessageImage {
    data: string;
    mimeType: string;
}
interface UserMessageProps {
    content: string;
    images?: UserMessageImage[];
    inputAnnotations?: readonly DaemonInputAnnotation[];
    isLocateFlashing?: boolean;
    sendFailed?: boolean;
    onRetrySend?: () => void;
    /** Click an uploaded image to preview it in the right panel. */
    onImagePreview?: (src: string, alt?: string) => void;
}
export declare const UserMessage: import("react").NamedExoticComponent<UserMessageProps>;
export declare function ReadonlyComposerTag({ tag, composerTagIcons, renderComposerTag, renderComposerTagTooltip, onComposerTagClick, title, preserveCustomKindLabel, }: {
    tag: WebShellComposerTag;
    composerTagIcons: WebShellComposerTagIconMap | undefined;
    renderComposerTag: ComposerTagRenderer | undefined;
    renderComposerTagTooltip: ComposerTagRenderer | undefined;
    onComposerTagClick: ComposerTagClickHandler | undefined;
    title?: string;
    preserveCustomKindLabel?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export {};
