import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillAvatar } from '@/components/ui/skill-avatar';
import { SourceAvatar } from '@/components/ui/source-avatar';
// ============================================================================
// MentionBadge Component
// ============================================================================
/**
 * MentionBadge - Inline badge for displaying active @mentions
 *
 * Used in the ActiveMentionBadges row above the input field to show
 * skills and sources that have been mentioned via @.
 */
export function MentionBadge({ type, label, skill, source, workspaceId, onRemove, className, }) {
    return (_jsxs("span", { className: cn('inline-flex items-center gap-1.5 h-6 pl-1 pr-1.5 rounded-[6px]', 'bg-foreground/5 text-[12px] text-foreground', 'transition-colors hover:bg-foreground/8', className), children: [type === 'skill' && skill && (_jsx(SkillAvatar, { skill: skill, size: "xs", workspaceId: workspaceId })), type === 'source' && source && (_jsx(SourceAvatar, { source: source, size: "xs" })), _jsx("span", { className: "truncate max-w-[100px]", children: label }), onRemove && (_jsx("button", { type: "button", onClick: (e) => {
                    e.stopPropagation();
                    onRemove();
                }, className: "shrink-0 h-4 w-4 rounded-[3px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors", children: _jsx(X, { className: "h-3 w-3" }) }))] }));
}
/**
 * ActiveMentionBadges - Row of mention badges shown above the input
 *
 * Displays all active @mentions (skills and sources) as removable badges.
 * Hidden when there are no mentions.
 */
export function ActiveMentionBadges({ mentions, workspaceId, onRemove, className, }) {
    if (mentions.length === 0)
        return null;
    return (_jsx("div", { className: cn('flex flex-wrap gap-1 px-4 pt-2', className), children: mentions.map((mention) => (_jsx(MentionBadge, { type: mention.type, label: mention.label, skill: mention.skill, source: mention.source, workspaceId: workspaceId, onRemove: onRemove ? () => onRemove(mention.id, mention.type) : undefined }, `${mention.type}-${mention.id}`))) }));
}
//# sourceMappingURL=mention-badge.js.map