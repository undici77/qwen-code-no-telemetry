import { jsx as _jsx } from "react/jsx-runtime";
/**
 * SkillAvatar - Thin wrapper around EntityIcon for skills.
 *
 * Sets fallbackIcon={Zap} and delegates all rendering to EntityIcon.
 * Use `fluid` prop for fill-parent sizing (e.g., Info_Page.Hero).
 */
import { Zap } from 'lucide-react';
import { EntityIcon } from '@/components/ui/entity-icon';
import { useEntityIcon } from '@/lib/icon-cache';
export function SkillAvatar({ skill, size = 'md', fluid, className, workspaceId }) {
    const icon = useEntityIcon({
        workspaceId: workspaceId ?? '',
        entityType: 'skill',
        identifier: skill.slug,
        iconPath: skill.iconPath,
        iconValue: skill.metadata.icon,
    });
    return (_jsx(EntityIcon, { icon: icon, size: size, fallbackIcon: Zap, alt: skill.metadata.name, className: className, containerClassName: fluid ? 'h-full w-full' : undefined }));
}
//# sourceMappingURL=skill-avatar.js.map