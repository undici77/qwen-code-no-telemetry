import type { EmbeddedManagerPage } from '../plugins/manager-page';
interface SkillsManagerPageProps {
    onClose: () => void;
    onUseSkill: (name: string) => void;
    embedded?: EmbeddedManagerPage;
}
export declare function SkillsManagerPage({ onClose, onUseSkill, embedded, }: SkillsManagerPageProps): import("react/jsx-runtime").JSX.Element;
export {};
