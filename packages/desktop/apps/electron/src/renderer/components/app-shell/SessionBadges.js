import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { parseLabelEntry } from '@craft-agent/shared/labels';
import { EntityListLabelBadge } from '@/components/ui/entity-list-label-badge';
import { useSessionListContext } from '@/context/SessionListContext';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
export function SessionBadges({ item }) {
    const ctx = useSessionListContext();
    const resolvedLabels = useMemo(() => {
        if (!item.labels || item.labels.length === 0 || ctx.flatLabels.length === 0)
            return [];
        return item.labels
            .map((entry) => {
            const parsed = parseLabelEntry(entry);
            const config = ctx.flatLabels.find((l) => l.id === parsed.id);
            if (!config)
                return null;
            return { config, rawValue: parsed.rawValue };
        })
            .filter((l) => l != null);
    }, [item.labels, ctx.flatLabels]);
    if (!FEATURE_FLAGS.sessionLabelsUi)
        return null;
    if (resolvedLabels.length === 0)
        return null;
    return (_jsx(_Fragment, { children: resolvedLabels.map(({ config, rawValue }, idx) => (_jsx(EntityListLabelBadge, { label: config, rawValue: rawValue, sessionLabels: item.labels || [], onLabelsChange: (updated) => ctx.onLabelsChange?.(item.id, updated) }, `${config.id}-${idx}`))) }));
}
//# sourceMappingURL=SessionBadges.js.map