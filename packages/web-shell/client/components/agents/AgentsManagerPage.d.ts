import type { EmbeddedManagerPage } from '../plugins/manager-page';
interface AgentsManagerPageProps {
    onClose: () => void;
    embedded?: EmbeddedManagerPage;
    initialCreateScope?: 'workspace' | 'global' | null;
}
export declare function AgentsManagerPage({ onClose, embedded, initialCreateScope, }: AgentsManagerPageProps): import("react/jsx-runtime").JSX.Element;
export {};
