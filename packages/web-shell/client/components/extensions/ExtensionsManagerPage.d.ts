import { type Ref } from 'react';
import type { EmbeddedManagerPage } from '../plugins/manager-page';
interface ExtensionsManagerPageProps {
  onClose: () => void;
  initialFocusRef?: Ref<HTMLHeadingElement>;
  embedded?: EmbeddedManagerPage;
}
export declare function ExtensionsManagerPage({
  onClose,
  initialFocusRef,
  embedded,
}: ExtensionsManagerPageProps): import('react/jsx-runtime').JSX.Element;
export {};
