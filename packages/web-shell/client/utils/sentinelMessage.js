export function createSentinelSerializer(sentinel) {
    return {
        serialize(data) {
            return `${sentinel}${JSON.stringify(data)}`;
        },
        parse(content) {
            if (!content.startsWith(sentinel))
                return null;
            try {
                const parsed = JSON.parse(content.slice(sentinel.length));
                if (!parsed || typeof parsed !== 'object')
                    return null;
                return parsed;
            }
            catch {
                return null;
            }
        },
    };
}
//# sourceMappingURL=sentinelMessage.js.map