import { resolveTextAnnotations } from '../markdown/annotation-resolver';
import { annotationColorToCss, } from './annotation-style-tokens';
import { getCanonicalText, getClientRectsForOffsets, consolidateRectsByLine, } from './annotation-core';
import { getAnnotationFollowUpState } from './follow-up-state';
export function computeAnnotationOverlayGeometry({ root, renderedAnnotations, persistedAnnotations, annotationIndexOverrides, }) {
    if (renderedAnnotations.length === 0) {
        return { rects: [], chips: [], unresolved: [] };
    }
    const fullText = getCanonicalText(root);
    const resolution = resolveTextAnnotations(fullText, renderedAnnotations);
    const annotationIndexById = new Map((persistedAnnotations ?? []).map((annotation, idx) => [annotation.id, idx + 1]));
    const rootRect = root.getBoundingClientRect();
    const rects = [];
    const chips = [];
    for (const item of resolution.resolved) {
        const followUpState = getAnnotationFollowUpState(item.annotation);
        const pendingFollowUp = followUpState === 'pending';
        const sentFollowUp = followUpState === 'sent';
        const rawRects = getClientRectsForOffsets(root, item.range.start, item.range.end)
            .map(rect => ({
            id: item.annotation.id,
            left: rect.left - rootRect.left,
            top: rect.top - rootRect.top,
            width: rect.width,
            height: rect.height,
            color: annotationColorToCss(item.annotation.style?.color),
            pendingFollowUp,
            sentFollowUp,
        }));
        const lineRects = consolidateRectsByLine(rawRects);
        rects.push(...lineRects);
        const annotationIndex = annotationIndexOverrides?.get(item.annotation.id) ?? annotationIndexById.get(item.annotation.id);
        if (annotationIndex == null || lineRects.length === 0) {
            continue;
        }
        const minTop = Math.min(...lineRects.map(rect => rect.top));
        const topRowRects = lineRects.filter(rect => Math.abs(rect.top - minTop) <= 2);
        const anchorRect = topRowRects.reduce((best, rect) => {
            const bestRight = best.left + best.width;
            const rectRight = rect.left + rect.width;
            return rectRight > bestRight ? rect : best;
        });
        chips.push({
            id: item.annotation.id,
            index: annotationIndex,
            left: anchorRect.left + anchorRect.width,
            top: anchorRect.top,
            pendingFollowUp,
            sentFollowUp,
        });
    }
    return {
        rects,
        chips,
        unresolved: resolution.unresolved,
    };
}
//# sourceMappingURL=annotation-overlay-geometry.js.map