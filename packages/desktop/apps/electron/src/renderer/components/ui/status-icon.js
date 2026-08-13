import { jsx as _jsx } from "react/jsx-runtime";
/**
 * StatusIcon - Thin wrapper around EntityIcon for statuses.
 *
 * Sets fallbackIcon={Circle}. Color is NOT handled here — the parent applies
 * a Tailwind color class (e.g. 'text-success') which cascades into colorable
 * SVGs via CSS currentColor inheritance.
 *
 * Status icons are discovered at `statuses/icons/{statusId}.{ext}`.
 */
import { Circle } from 'lucide-react';
import { EntityIcon } from '@/components/ui/entity-icon';
import { useEntityIcon } from '@/lib/icon-cache';
const LOCAL_STATUS_ICON_FILENAME_PATTERN = /^[^/\\]+\.(svg|png|jpe?g|webp)$/i;
export function resolveStatusIconSource(statusId, icon) {
    const trimmedIcon = typeof icon === 'string' ? icon.trim() : undefined;
    if (trimmedIcon && LOCAL_STATUS_ICON_FILENAME_PATTERN.test(trimmedIcon)) {
        return {
            iconPath: `statuses/icons/${trimmedIcon}`,
        };
    }
    return {
        iconValue: trimmedIcon,
        iconFileName: statusId,
    };
}
export function StatusIcon({ statusId, icon, workspaceId, size = 'sm', className, chromeless, bare, }) {
    const { iconPath, iconValue, iconFileName } = resolveStatusIconSource(statusId, icon);
    const resolved = useEntityIcon({
        workspaceId,
        entityType: 'status',
        identifier: statusId,
        iconPath,
        iconDir: 'statuses/icons',
        iconValue,
        // Status icons use {statusId}.ext naming (not icon.ext)
        iconFileName,
    });
    return (_jsx(EntityIcon, { icon: resolved, size: size, fallbackIcon: Circle, className: className, chromeless: chromeless, bare: bare }));
}
//# sourceMappingURL=status-icon.js.map