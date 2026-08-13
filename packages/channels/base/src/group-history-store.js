import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, } from 'node:fs';
import { dirname, join } from 'node:path';
const DEFAULT_MAX_KEYS = 1000;
const DEFAULT_COMPACT_AFTER_RECORDS = 1000;
export class GroupHistoryStore {
    filePath;
    maxKeys;
    compactAfterRecords;
    constructor(filePath, options = {}) {
        this.filePath = filePath;
        this.maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
        this.compactAfterRecords =
            options.compactAfterRecords ?? DEFAULT_COMPACT_AFTER_RECORDS;
    }
    record(key, entry, limit) {
        const normalizedLimit = normalizeLimit(limit);
        if (normalizedLimit <= 0) {
            return;
        }
        const loaded = this.loadState();
        const state = loaded.entries;
        const limits = loaded.limits;
        const current = state.get(key) ?? [];
        current.push(entry);
        if (current.length > normalizedLimit) {
            current.splice(0, current.length - normalizedLimit);
        }
        state.delete(key);
        state.set(key, current);
        limits.set(key, normalizedLimit);
        const evicted = evictOldKeys(state, this.maxKeys, limits);
        this.append({
            type: 'message',
            key,
            limit: normalizedLimit,
            entry,
            recordedAt: Date.now(),
        });
        if (evicted ||
            loaded.hadInvalidRecords ||
            loaded.recordCount + 1 >= this.compactAfterRecords) {
            this.compact(state, limits);
        }
    }
    drain(key, limit) {
        const normalizedLimit = normalizeLimit(limit);
        const loaded = this.loadState();
        const state = loaded.entries;
        const entries = normalizedLimit > 0 ? (state.get(key) ?? []).slice(-normalizedLimit) : [];
        if (state.has(key)) {
            state.delete(key);
            loaded.limits.delete(key);
            this.append({ type: 'clear', key, recordedAt: Date.now() });
        }
        return entries;
    }
    clear(key) {
        const loaded = this.loadState();
        const state = loaded.entries;
        if (!state.has(key)) {
            return;
        }
        state.delete(key);
        loaded.limits.delete(key);
        this.append({ type: 'clear', key, recordedAt: Date.now() });
        this.compact(state, loaded.limits);
    }
    clearAll() {
        const loaded = this.loadState();
        if (loaded.entries.size === 0) {
            return;
        }
        const recordedAt = Date.now();
        for (const key of loaded.entries.keys()) {
            this.append({ type: 'clear', key, recordedAt });
        }
        this.compact(new Map(), new Map());
    }
    size(key) {
        const state = this.loadState().entries;
        if (key !== undefined) {
            return state.get(key)?.length ?? 0;
        }
        return state.size;
    }
    loadState() {
        const state = new Map();
        const limits = new Map();
        const read = this.readRecords();
        for (const record of read.records) {
            if (record.type === 'clear') {
                state.delete(record.key);
                limits.delete(record.key);
                continue;
            }
            const current = state.get(record.key) ?? [];
            current.push(record.entry);
            if (current.length > record.limit) {
                current.splice(0, current.length - record.limit);
            }
            state.delete(record.key);
            state.set(record.key, current);
            limits.set(record.key, record.limit);
            evictOldKeys(state, this.maxKeys, limits);
        }
        return {
            entries: state,
            limits,
            recordCount: read.records.length,
            hadInvalidRecords: read.hadInvalidRecords,
        };
    }
    readRecords() {
        if (!existsSync(this.filePath)) {
            return { records: [], hadInvalidRecords: false };
        }
        let data;
        try {
            data = readFileSync(this.filePath, 'utf-8');
        }
        catch (err) {
            if (isErrnoCode(err, 'ENOENT')) {
                return { records: [], hadInvalidRecords: false };
            }
            throw err;
        }
        const records = [];
        let hadInvalidRecords = false;
        for (const line of data.split('\n')) {
            if (line.trim().length === 0) {
                continue;
            }
            try {
                const parsed = JSON.parse(line);
                if (isGroupHistoryRecord(parsed)) {
                    records.push(parsed);
                }
                else {
                    hadInvalidRecords = true;
                }
            }
            catch {
                // Ignore corrupt lines. The next compaction will rewrite valid state.
                hadInvalidRecords = true;
            }
        }
        return { records, hadInvalidRecords };
    }
    append(record) {
        const dir = dirname(this.filePath);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        chmodPrivate(dir, 0o700);
        appendFileSync(this.filePath, `${JSON.stringify(record)}\n`, {
            encoding: 'utf-8',
            mode: 0o600,
        });
        chmodPrivate(this.filePath, 0o600);
    }
    compact(state, limits) {
        const dir = dirname(this.filePath);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        chmodPrivate(dir, 0o700);
        const records = [];
        const recordedAt = Date.now();
        for (const [key, entries] of state) {
            for (const entry of entries) {
                records.push({
                    type: 'message',
                    key,
                    limit: limits.get(key) ?? entries.length,
                    entry,
                    recordedAt,
                });
            }
        }
        const data = records.length > 0
            ? `${records.map((record) => JSON.stringify(record)).join('\n')}\n`
            : '';
        const tempPath = join(dir, `${Date.now()}-${process.pid}-${Math.random().toString(16).slice(2)}.tmp`);
        writeFileSync(tempPath, data, { encoding: 'utf-8', mode: 0o600 });
        chmodPrivate(tempPath, 0o600);
        renameSync(tempPath, this.filePath);
        chmodPrivate(this.filePath, 0o600);
    }
}
function normalizeLimit(limit) {
    if (!Number.isFinite(limit) || limit <= 0) {
        return 0;
    }
    return Math.floor(limit);
}
function evictOldKeys(state, maxKeys, limits) {
    let evicted = false;
    while (state.size > maxKeys) {
        const oldest = state.keys().next().value;
        if (oldest === undefined) {
            return evicted;
        }
        state.delete(oldest);
        limits?.delete(oldest);
        evicted = true;
    }
    return evicted;
}
function isGroupHistoryRecord(value) {
    if (!isRecord(value)) {
        return false;
    }
    if (value['type'] === 'clear') {
        return typeof value['key'] === 'string';
    }
    if (value['type'] !== 'message') {
        return false;
    }
    return (typeof value['key'] === 'string' &&
        typeof value['limit'] === 'number' &&
        isGroupHistoryEntry(value['entry']));
}
function isGroupHistoryEntry(value) {
    return (isRecord(value) &&
        typeof value['senderId'] === 'string' &&
        typeof value['senderName'] === 'string' &&
        typeof value['text'] === 'string' &&
        typeof value['timestamp'] === 'number');
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isErrnoCode(err, code) {
    return (err instanceof Error &&
        'code' in err &&
        err.code === code);
}
function chmodPrivate(path, mode) {
    try {
        chmodSync(path, mode);
    }
    catch {
        // Best effort: some filesystems/platforms do not support POSIX modes.
    }
}
//# sourceMappingURL=group-history-store.js.map