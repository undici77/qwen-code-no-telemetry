/**
 * v1 normalization policy for quote fallback matching:
 * - collapse any whitespace run (spaces, tabs, newlines) into a single space
 * - preserve all non-whitespace characters as-is
 *
 * We keep a char-level map back to original indices so resolved ranges are
 * returned in original (un-normalized) coordinates.
 */
function normalizeWhitespaceWithMap(input) {
    const outChars = [];
    const map = [];
    let i = 0;
    let inWhitespace = false;
    while (i < input.length) {
        const ch = input[i];
        if (/\s/.test(ch)) {
            if (!inWhitespace) {
                outChars.push(' ');
                map.push(i);
                inWhitespace = true;
            }
            i += 1;
            continue;
        }
        inWhitespace = false;
        outChars.push(ch);
        map.push(i);
        i += 1;
    }
    return { text: outChars.join(''), map };
}
function findQuoteRange(fullText, quote) {
    if (!quote.exact)
        return null;
    // First try exact matching without normalization (fast path).
    let searchIndex = fullText.indexOf(quote.exact);
    while (searchIndex !== -1) {
        const candidateStart = searchIndex;
        const candidateEnd = candidateStart + quote.exact.length;
        const prefixOk = !quote.prefix || fullText.slice(Math.max(0, candidateStart - quote.prefix.length), candidateStart) === quote.prefix;
        const suffixOk = !quote.suffix || fullText.slice(candidateEnd, candidateEnd + quote.suffix.length) === quote.suffix;
        if (prefixOk && suffixOk) {
            return { start: candidateStart, end: candidateEnd };
        }
        searchIndex = fullText.indexOf(quote.exact, searchIndex + 1);
    }
    // Fallback: normalized matching for minor whitespace drift.
    const normalizedFull = normalizeWhitespaceWithMap(fullText);
    const normalizedExact = normalizeWhitespaceWithMap(quote.exact).text;
    const normalizedPrefix = quote.prefix ? normalizeWhitespaceWithMap(quote.prefix).text : undefined;
    const normalizedSuffix = quote.suffix ? normalizeWhitespaceWithMap(quote.suffix).text : undefined;
    if (!normalizedExact)
        return null;
    let normalizedIndex = normalizedFull.text.indexOf(normalizedExact);
    while (normalizedIndex !== -1) {
        const normalizedEnd = normalizedIndex + normalizedExact.length;
        const prefixOk = !normalizedPrefix ||
            normalizedFull.text.slice(Math.max(0, normalizedIndex - normalizedPrefix.length), normalizedIndex) === normalizedPrefix;
        const suffixOk = !normalizedSuffix ||
            normalizedFull.text.slice(normalizedEnd, normalizedEnd + normalizedSuffix.length) === normalizedSuffix;
        if (prefixOk && suffixOk) {
            const originalStart = normalizedFull.map[normalizedIndex];
            const endMapIndex = normalizedEnd - 1;
            const originalLast = normalizedFull.map[endMapIndex];
            if (originalStart != null && originalLast != null) {
                return { start: originalStart, end: originalLast + 1 };
            }
        }
        normalizedIndex = normalizedFull.text.indexOf(normalizedExact, normalizedIndex + 1);
    }
    return null;
}
export function resolveTextAnnotations(fullText, annotations) {
    if (!annotations?.length) {
        return { resolved: [], unresolved: [] };
    }
    const resolved = [];
    const unresolved = [];
    for (const annotation of annotations) {
        const selectors = annotation.target?.selectors ?? [];
        if (!selectors.length) {
            unresolved.push({ annotation, reason: 'missing-selectors' });
            continue;
        }
        const position = selectors.find(s => s.type === 'text-position');
        if (position &&
            Number.isInteger(position.start) &&
            Number.isInteger(position.end) &&
            position.start >= 0 &&
            position.end > position.start &&
            position.end <= fullText.length) {
            resolved.push({
                annotation,
                range: { start: position.start, end: position.end },
                method: 'text-position',
            });
            continue;
        }
        const quote = selectors.find(s => s.type === 'text-quote');
        if (!quote?.exact) {
            unresolved.push({ annotation, reason: 'invalid-position' });
            continue;
        }
        const range = findQuoteRange(fullText, quote);
        if (!range) {
            unresolved.push({ annotation, reason: 'quote-not-found' });
            continue;
        }
        resolved.push({ annotation, range, method: 'text-quote' });
    }
    return { resolved, unresolved };
}
//# sourceMappingURL=annotation-resolver.js.map