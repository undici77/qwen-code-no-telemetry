/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { randomUUID } from 'node:crypto';
import { getProjectHash } from '../utils/paths.js';
import {} from '@google/genai';
import {} from './chatRecordingService.js';
import { uiTelemetryService } from '../telemetry/uiTelemetry.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { LITE_READ_BUF_SIZE, readLastJsonStringFieldSync, readLastJsonStringFieldsSync, } from '../utils/sessionStorageUtils.js';
import * as jsonl from '../utils/jsonl-utils.js';
import { Storage } from '../config/storage.js';
const debugLogger = createDebugLogger('SESSION');
/**
 * Maximum number of files to process when listing sessions.
 * This is a safety limit to prevent performance issues with very large chat directories.
 */
const MAX_FILES_TO_PROCESS = 10000;
/**
 * Maximum character length for a session custom title.
 * Shared across CLI, WebUI, VSCode, and ACP.
 */
export const SESSION_TITLE_MAX_LENGTH = 200;
/**
 * Pattern for validating session file names.
 * Session files are named as `${sessionId}.jsonl` where sessionId is a UUID-like identifier
 * (32-36 hex characters, optionally with hyphens).
 */
const SESSION_FILE_PATTERN = /^[0-9a-fA-F-]{32,36}\.jsonl$/;
/** Maximum number of lines to scan when looking for the first prompt text. */
const MAX_PROMPT_SCAN_LINES = 10;
/**
 * Maximum bytes to read from head/tail of a session file.
 * Used by readLastRecordUuid which still does its own tail read.
 */
const TAIL_READ_SIZE = 64 * 1024;
/**
 * Service for managing chat sessions.
 *
 * This service handles:
 * - Listing sessions with pagination (ordered by mtime)
 * - Loading full session data for resumption
 * - Removing sessions
 *
 * Sessions are stored as JSONL files, one per session.
 * File location: ~/.qwen/tmp/<project_id>/chats/
 */
export class SessionService {
    storage;
    projectHash;
    constructor(cwd) {
        this.storage = new Storage(cwd);
        this.projectHash = getProjectHash(cwd);
    }
    getChatsDir() {
        return path.join(this.storage.getProjectDir(), 'chats');
    }
    /**
     * Returns the absolute path to the sidecar JSON file that stores
     * worktree session state for the given session id. The file may not
     * exist yet — consumers must handle ENOENT as "no active worktree".
     */
    getWorktreeSessionPath(sessionId) {
        return path.join(this.getChatsDir(), `${sessionId}.worktree.json`);
    }
    /**
     * Reads the session title from a JSONL file.
     *
     * Delegates to {@link readLastJsonStringFieldSync}, which scans the tail
     * window first (fast path; almost always hits because finalize() re-appends
     * the title on every lifecycle event) and falls back to a bounded head
     * window when the tail has no match. The `custom_title` line-marker guards
     * against false matches from user content that happens to include a
     * `customTitle` field.
     */
    readSessionTitleFromFile(filePath, tailBuffer) {
        // Match only on actual custom_title system records. `'custom_title'` as
        // a loose substring can land on a user message that happens to contain
        // the literal "custom_title" (code review of this very file, etc.);
        // requiring the full `"subtype":"custom_title"` pattern guarantees the
        // match is on a system record written by {@link writeLineSync}, which
        // JSON.stringifies records in a predictable compact form.
        return readLastJsonStringFieldSync(filePath, 'customTitle', '"subtype":"custom_title"', tailBuffer);
    }
    /**
     * Reads both the custom title and its source from a session file in a
     * single pass — the helper extracts both fields from the same matching
     * `custom_title` line, so the pair is always consistent (never one field
     * from an old record and another from a new one).
     *
     * `titleSource` is absent on legacy records written before the field was
     * introduced — callers treat `undefined` as equivalent to `'manual'` so a
     * user's pre-upgrade rename is never displayed as if it were auto-generated.
     */
    readSessionTitleInfoFromFile(filePath, tailBuffer) {
        const hit = readLastJsonStringFieldsSync(filePath, 'customTitle', ['titleSource'], '"subtype":"custom_title"', tailBuffer);
        const title = hit['customTitle'];
        if (!title)
            return {};
        const rawSource = hit['titleSource'];
        const source = rawSource === 'auto' || rawSource === 'manual' ? rawSource : undefined;
        return { title, source };
    }
    /**
     * Public accessor: returns both the current custom title and its source
     * for a given session. Used by `ChatRecordingService` on resume to
     * preserve the persisted `titleSource` rather than defaulting to manual.
     */
    getSessionTitleInfo(sessionId) {
        if (!SESSION_FILE_PATTERN.test(`${sessionId}.jsonl`)) {
            return {};
        }
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        return this.readSessionTitleInfoFromFile(filePath);
    }
    /**
     * Reads the UUID of the last record in a session JSONL file.
     * Uses a tail-read strategy for efficiency.
     *
     * Each physical line is routed through `jsonl.parseLineTolerant` so a
     * `}{`-glued tail line (#3606 corruption shape) still yields its records
     * instead of being silently skipped — otherwise `renameSession` would set
     * `custom_title.parentUuid` to a stale uuid and `reconstructHistory` would
     * truncate the chain on resume.
     */
    readLastRecordUuid(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            const readStart = Math.max(0, fileSize - TAIL_READ_SIZE);
            const readLength = Math.min(fileSize, TAIL_READ_SIZE);
            const fd = fs.openSync(filePath, 'r');
            let buffer;
            let firstSegmentIsPartial = false;
            try {
                buffer = Buffer.alloc(readLength);
                fs.readSync(fd, buffer, 0, readLength, readStart);
                // The first split segment is partial only when the tail window
                // truly starts in the middle of a JSONL record. If the byte right
                // before `readStart` is `\n`, the window started on a record
                // boundary and the first segment is a complete line — the
                // 64-KiB-aligned case where `prev\n<exactly-64KiB-record>\n`
                // would otherwise drop the only readable record. Peek that byte
                // before deciding to shift.
                if (readStart > 0) {
                    const peek = Buffer.alloc(1);
                    fs.readSync(fd, peek, 0, 1, readStart - 1);
                    firstSegmentIsPartial = peek[0] !== 0x0a; // 0x0a = '\n'
                }
            }
            finally {
                fs.closeSync(fd);
            }
            const tail = buffer.toString('utf-8');
            const lines = tail.split('\n');
            // Discard the first segment ONLY when it's a true partial fragment.
            // Running tolerant recovery on a partial would surface a balanced
            // inner `{ "uuid": ... }` object from inside the record's payload as
            // if it were a top-level uuid — `renameSession` would then anchor
            // `custom_title.parentUuid` at payload data and break the parent
            // chain. Complete physical lines (including a boundary-aligned
            // first segment) are safe to recover.
            if (firstSegmentIsPartial) {
                lines.shift();
            }
            // Walk physical lines bottom-up; on each line walk recovered records
            // bottom-up too, so a `}{`-glued tail returns the *latest* record.
            for (let i = lines.length - 1; i >= 0; i--) {
                const trimmed = lines[i].trim();
                if (!trimmed)
                    continue;
                const records = jsonl.parseLineTolerant(trimmed, filePath);
                for (let j = records.length - 1; j >= 0; j--) {
                    const record = records[j];
                    if (record.uuid) {
                        return record.uuid;
                    }
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Extracts the first user prompt text from a Content object.
     */
    extractPromptText(message) {
        if (!message?.parts)
            return '';
        for (const part of message.parts) {
            if ('text' in part) {
                const textPart = part;
                const text = textPart.text;
                // Truncate long prompts for display
                return text.length > 200 ? `${text.slice(0, 200)}...` : text;
            }
        }
        return '';
    }
    /**
     * Finds the first available prompt text by scanning the first N records,
     * preferring user messages. Returns an empty string if none found.
     */
    extractFirstPromptFromRecords(records) {
        for (const record of records) {
            if (record.type !== 'user')
                continue;
            const prompt = this.extractPromptText(record.message);
            if (prompt)
                return prompt;
        }
        return '';
    }
    /**
     * Counts unique user/assistant message UUIDs in a session file by
     * streaming the JSONL line-by-line. Each physical line is routed
     * through `jsonl.parseLineTolerant` so a `}{`-glued line (#3606
     * corruption shape) still contributes both records, instead of being
     * silently dropped.
     *
     * Project-scoped: returns 0 if the file's first record belongs to a
     * different project. Sibling public methods (deleteSession,
     * renameSession, loadSession) apply the same first-record cwd check;
     * mirroring it here keeps lazy-count callers from accidentally
     * counting a session that lives in the shared chats directory but
     * belongs to another project.
     *
     * This is intentionally NOT called from {@link listSessions} or
     * {@link findSessionsByTitle} — it would be O(total bytes on disk) per
     * picker open, dominating wall time once a project accumulates dozens
     * of multi-MB sessions. Call this lazily, only when a specific
     * session's message count is about to be displayed (e.g., from a
     * preview panel) or computed from a resumed conversation.
     */
    async countSessionMessages(sessionId) {
        if (!SESSION_FILE_PATTERN.test(`${sessionId}.jsonl`)) {
            return 0;
        }
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        try {
            const firstRecords = await jsonl.readLines(filePath, 1);
            if (firstRecords.length === 0)
                return 0;
            if (getProjectHash(firstRecords[0].cwd) !== this.projectHash)
                return 0;
        }
        catch {
            return 0;
        }
        return this.countSessionMessagesFromPath(filePath);
    }
    async countSessionMessagesFromPath(filePath) {
        const uniqueUuids = new Set();
        try {
            const fileStream = fs.createReadStream(filePath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity,
            });
            for await (const line of rl) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                for (const record of jsonl.parseLineTolerant(trimmed, filePath)) {
                    if (record.type === 'user' || record.type === 'assistant') {
                        uniqueUuids.add(record.uuid);
                    }
                }
            }
            return uniqueUuids.size;
        }
        catch {
            return 0;
        }
    }
    /**
     * Lists sessions for the current project with pagination.
     *
     * Sessions are ordered by file modification time (most recent first).
     * Uses cursor-based pagination with mtime as the cursor.
     *
     * Only reads the first line of each JSONL file for efficiency.
     * Files are filtered by UUID pattern first, then by project hash.
     *
     * @param options Pagination options
     * @returns Paginated list of sessions
     */
    async listSessions(options = {}) {
        const { cursor, size = 20 } = options;
        const chatsDir = this.getChatsDir();
        // Get all valid session files (matching UUID pattern) with their stats
        let files = [];
        try {
            const fileNames = fs.readdirSync(chatsDir);
            for (const name of fileNames) {
                // Only process files matching session file pattern
                if (!SESSION_FILE_PATTERN.test(name))
                    continue;
                const filePath = path.join(chatsDir, name);
                try {
                    const stats = fs.statSync(filePath);
                    files.push({ name, mtime: stats.mtimeMs });
                }
                catch {
                    // Skip files we can't stat
                    continue;
                }
            }
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return { items: [], hasMore: false };
            }
            throw error;
        }
        // Sort by mtime descending (most recent first)
        files.sort((a, b) => b.mtime - a.mtime);
        // Apply cursor filter (items with mtime < cursor)
        if (cursor !== undefined) {
            files = files.filter((f) => f.mtime < cursor);
        }
        // Iterate through files until we have enough matching ones.
        // Different projects may share the same chats directory due to path sanitization,
        // so we need to filter by project hash and continue until we have enough items.
        const items = [];
        let filesProcessed = 0;
        let lastProcessedMtime;
        let hasMoreFiles = false;
        // Pre-allocate the tail-read buffer once and pass it to every
        // per-file metadata read. Without pooling, each session in the
        // page allocs+GCs a fresh 64KB Buffer; for a typical page of 20
        // that's ~1.3MB churn per /resume open. The helper reuses this
        // same scratch buffer for its bounded tail and head-window reads.
        const tailBuffer = Buffer.alloc(LITE_READ_BUF_SIZE);
        for (const file of files) {
            // Safety limit to prevent performance issues
            if (filesProcessed >= MAX_FILES_TO_PROCESS) {
                hasMoreFiles = true;
                break;
            }
            // Stop if we have enough items
            if (items.length >= size) {
                hasMoreFiles = true;
                break;
            }
            filesProcessed++;
            lastProcessedMtime = file.mtime;
            const filePath = path.join(chatsDir, file.name);
            const records = await jsonl.readLines(filePath, MAX_PROMPT_SCAN_LINES);
            if (records.length === 0)
                continue;
            const firstRecord = records[0];
            // Skip if not matching current project
            // We use cwd comparison since first record doesn't have projectHash
            const recordProjectHash = getProjectHash(firstRecord.cwd);
            if (recordProjectHash !== this.projectHash)
                continue;
            const prompt = this.extractFirstPromptFromRecords(records);
            const titleInfo = this.readSessionTitleInfoFromFile(filePath, tailBuffer);
            items.push({
                sessionId: firstRecord.sessionId,
                cwd: firstRecord.cwd,
                startTime: firstRecord.timestamp,
                mtime: file.mtime,
                prompt,
                gitBranch: firstRecord.gitBranch,
                filePath,
                // messageCount intentionally omitted — see SessionListItem
                // and `countSessionMessages` for the rationale.
                customTitle: titleInfo.title,
                titleSource: titleInfo.source,
            });
        }
        // Determine next cursor (mtime of last processed file)
        // Only set if there are more files to process
        const nextCursor = hasMoreFiles && lastProcessedMtime !== undefined
            ? lastProcessedMtime
            : undefined;
        return {
            items,
            nextCursor,
            hasMore: hasMoreFiles,
        };
    }
    /**
     * Reads all records from a session file.
     */
    async readAllRecords(filePath) {
        try {
            return await jsonl.read(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                debugLogger.error('Error reading session file:', error);
            }
            return [];
        }
    }
    /**
     * Aggregates multiple records with the same uuid into a single ChatRecord.
     * Merges content fields (message, tokens, model, toolCallResult).
     */
    aggregateRecords(records) {
        if (records.length === 0) {
            throw new Error('Cannot aggregate empty records array');
        }
        const base = { ...records[0] };
        for (let i = 1; i < records.length; i++) {
            const record = records[i];
            // Merge message (Content objects)
            if (record.message !== undefined) {
                if (base.message === undefined) {
                    base.message = record.message;
                }
                else {
                    base.message = {
                        role: base.message.role,
                        parts: [
                            ...(base.message.parts || []),
                            ...(record.message.parts || []),
                        ],
                    };
                }
            }
            // Merge tokens (take the latest)
            if (record.usageMetadata) {
                base.usageMetadata = record.usageMetadata;
            }
            // Merge toolCallResult
            if (record.toolCallResult && !base.toolCallResult) {
                base.toolCallResult = record.toolCallResult;
            }
            // Merge model (take the first non-empty one)
            if (record.model && !base.model) {
                base.model = record.model;
            }
            // Update timestamp to the latest
            if (record.timestamp > base.timestamp) {
                base.timestamp = record.timestamp;
            }
        }
        return base;
    }
    /**
     * Reconstructs a linear conversation from tree-structured records.
     */
    reconstructHistory(records, leafUuid) {
        if (records.length === 0)
            return [];
        const recordsByUuid = new Map();
        for (const record of records) {
            const existing = recordsByUuid.get(record.uuid) || [];
            existing.push(record);
            recordsByUuid.set(record.uuid, existing);
        }
        let currentUuid = leafUuid ?? records[records.length - 1].uuid;
        const uuidChain = [];
        const visited = new Set();
        while (currentUuid && !visited.has(currentUuid)) {
            visited.add(currentUuid);
            uuidChain.push(currentUuid);
            const recordsForUuid = recordsByUuid.get(currentUuid);
            if (!recordsForUuid || recordsForUuid.length === 0)
                break;
            currentUuid = recordsForUuid[0].parentUuid;
        }
        uuidChain.reverse();
        const messages = [];
        for (const uuid of uuidChain) {
            const recordsForUuid = recordsByUuid.get(uuid);
            if (recordsForUuid && recordsForUuid.length > 0) {
                messages.push(this.aggregateRecords(recordsForUuid));
            }
        }
        return messages;
    }
    /**
     * Loads a session by its session ID.
     * Reconstructs the full conversation from tree-structured records.
     *
     * @param sessionId The session ID to load
     * @returns Session data for resumption, or null if not found
     */
    async loadSession(sessionId) {
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        const records = await this.readAllRecords(filePath);
        if (records.length === 0) {
            return;
        }
        // Verify this session belongs to the current project
        const firstRecord = records[0];
        const recordProjectHash = getProjectHash(firstRecord.cwd);
        if (recordProjectHash !== this.projectHash) {
            return;
        }
        // Reconstruct linear history
        const messages = this.reconstructHistory(records);
        if (messages.length === 0) {
            return;
        }
        const lastMessage = messages[messages.length - 1];
        const stats = fs.statSync(filePath);
        const conversation = {
            sessionId: firstRecord.sessionId,
            projectHash: this.projectHash,
            startTime: firstRecord.timestamp,
            lastUpdated: new Date(stats.mtimeMs).toISOString(),
            messages,
        };
        return {
            conversation,
            filePath,
            lastCompletedUuid: lastMessage.uuid,
        };
    }
    /**
     * Removes a session by its session ID.
     *
     * @param sessionId The session ID to remove
     * @returns true if removed, false if not found
     */
    async removeSession(sessionId) {
        if (!SESSION_FILE_PATTERN.test(`${sessionId}.jsonl`)) {
            return false;
        }
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        try {
            // Verify the file exists and belongs to this project
            const records = await jsonl.readLines(filePath, 1);
            if (records.length === 0) {
                return false;
            }
            const recordProjectHash = getProjectHash(records[0].cwd);
            if (recordProjectHash !== this.projectHash) {
                return false;
            }
            fs.unlinkSync(filePath);
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
    /**
     * Removes multiple sessions in one call.
     *
     * Each session is processed independently — a failure on one does not
     * abort the rest. Sessions that don't exist (or belong to a different
     * project) are reported in {@link notFound}; thrown filesystem
     * errors are surfaced per-id in {@link errors} so callers can decide
     * whether to retry.
     *
     * @param sessionIds IDs to remove. Duplicates are de-duplicated.
     * @returns Per-id outcomes: which were removed, which were not found,
     *   and which threw an error.
     */
    async removeSessions(sessionIds) {
        const removed = [];
        const notFound = [];
        const errors = [];
        const uniqueSessionIds = [...new Set(sessionIds)];
        const results = await Promise.allSettled(uniqueSessionIds.map((sessionId) => this.removeSession(sessionId)));
        for (let i = 0; i < results.length; i++) {
            const sessionId = uniqueSessionIds[i];
            if (sessionId === undefined)
                continue;
            const result = results[i];
            if (result.status === 'fulfilled') {
                if (result.value) {
                    removed.push(sessionId);
                }
                else {
                    notFound.push(sessionId);
                }
            }
            else {
                errors.push({ sessionId, error: result.reason });
            }
        }
        return { removed, notFound, errors };
    }
    /**
     * Renames a session by appending a custom_title system record to its JSONL file.
     *
     * @param sessionId The session ID to rename
     * @param title The new custom title
     * @param titleSource Where the title came from. Defaults to `'manual'` so
     *   existing callers are unchanged — pass `'auto'` only for titles produced
     *   by the auto-title generator.
     * @returns true if renamed successfully, false if session not found
     */
    async renameSession(sessionId, title, titleSource = 'manual') {
        if (!SESSION_FILE_PATTERN.test(`${sessionId}.jsonl`)) {
            return false;
        }
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        try {
            // Verify the file exists and belongs to this project
            const records = await jsonl.readLines(filePath, 1);
            if (records.length === 0) {
                return false;
            }
            const recordProjectHash = getProjectHash(records[0].cwd);
            if (recordProjectHash !== this.projectHash) {
                return false;
            }
            // Read the last record's UUID so the custom_title record is properly
            // chained into the parent history.  reconstructHistory() walks from the
            // tail record upward via parentUuid; a null parentUuid would sever the
            // chain and cause the session to appear empty on next load.
            const lastUuid = this.readLastRecordUuid(filePath);
            // Append a custom_title system record. `renameSession` is the
            // fallback path when no live recording service is attached (e.g., from
            // the WebUI or VSCode extension). Callers pass `titleSource='auto'`
            // only when the title came from the auto-generator; defaults to
            // 'manual' for explicit user renames.
            const titleRecord = {
                uuid: randomUUID(),
                parentUuid: lastUuid,
                sessionId,
                timestamp: new Date().toISOString(),
                type: 'system',
                subtype: 'custom_title',
                cwd: records[0].cwd,
                version: records[0].version,
                systemPayload: { customTitle: title, titleSource },
            };
            jsonl.writeLineSync(filePath, titleRecord);
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
    /**
     * Forks a session to a new sessionId.
     *
     * Reads the source JSONL into memory, rewrites every record's `sessionId`
     * to `newSessionId`, rebuilds the `parentUuid` chain in write order so the
     * fork is a linear continuation, stamps `forkedFrom: { sessionId, messageUuid }`
     * on every copied record for audit, and writes the result to `<newId>.jsonl`.
     *
     * Mirrors Claude Code's `/branch` storage model: full in-memory copy + per-
     * message forkedFrom (see claude-code/src/commands/branch/branch.ts).
     *
     * The source file is not modified.
     *
     * @throws If source does not exist, source is empty, source belongs to a
     *   different project, or the target file already exists.
     */
    async forkSession(sourceSessionId, newSessionId) {
        if (!SESSION_FILE_PATTERN.test(`${sourceSessionId}.jsonl`)) {
            throw new Error(`Invalid source sessionId: ${sourceSessionId}`);
        }
        if (!SESSION_FILE_PATTERN.test(`${newSessionId}.jsonl`)) {
            throw new Error(`Invalid new sessionId: ${newSessionId}`);
        }
        const chatsDir = this.getChatsDir();
        const sourcePath = path.join(chatsDir, `${sourceSessionId}.jsonl`);
        const targetPath = path.join(chatsDir, `${newSessionId}.jsonl`);
        // Read + parse the full source transcript.
        const records = await jsonl.read(sourcePath);
        if (records.length === 0) {
            throw new Error(`Source session not found or empty: ${sourceSessionId}`);
        }
        // Verify project ownership via the first record's cwd.
        if (getProjectHash(records[0].cwd) !== this.projectHash) {
            throw new Error(`Source session does not belong to current project: ${sourceSessionId}`);
        }
        // Rebuild the parentUuid chain in write order so the fork is a clean
        // linear descendant. `forkedFrom` captures the origin of each message.
        let prevUuid = null;
        const forked = records.map((record) => {
            const next = {
                ...record,
                sessionId: newSessionId,
                parentUuid: prevUuid,
                forkedFrom: {
                    sessionId: sourceSessionId,
                    messageUuid: record.uuid,
                },
            };
            prevUuid = record.uuid;
            return next;
        });
        fs.mkdirSync(chatsDir, { recursive: true });
        const body = forked.map((r) => JSON.stringify(r)).join('\n') + '\n';
        // Exclusive create: one syscall that both asserts "file doesn't exist"
        // and opens for writing, eliminating the TOCTOU window between a
        // separate existsSync check and writeFileSync. Also guarantees we
        // never silently overwrite an existing session file.
        let fd;
        try {
            fd = fs.openSync(targetPath, 'wx', 0o600);
        }
        catch (err) {
            if (err.code === 'EEXIST') {
                throw new Error(`Target session file already exists: ${newSessionId}`);
            }
            throw err;
        }
        try {
            fs.writeFileSync(fd, body, { encoding: 'utf8' });
        }
        finally {
            fs.closeSync(fd);
        }
        return { filePath: targetPath, copiedCount: forked.length };
    }
    /**
     * Gets the custom title for a session by reading from its JSONL file.
     *
     * @param sessionId The session ID to look up
     * @returns The custom title, or undefined if none set
     */
    getSessionTitle(sessionId) {
        if (!SESSION_FILE_PATTERN.test(`${sessionId}.jsonl`)) {
            return undefined;
        }
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        return this.readSessionTitleFromFile(filePath);
    }
    /**
     * Finds sessions by custom title.
     * Returns all matching sessions ordered by most recent first.
     *
     * @param title The custom title to search for (case-insensitive exact match)
     * @returns Array of matching session list items
     */
    async findSessionsByTitle(title) {
        const normalizedTitle = title.toLowerCase().trim();
        const matches = [];
        const chatsDir = this.getChatsDir();
        // Scan all session files directly rather than paging through
        // listSessions(): the mtime-only cursor there uses a strict `<` boundary,
        // so sessions that share an mtime with the page's last entry are skipped,
        // which would silently drop valid title matches.
        let fileNames;
        try {
            fileNames = fs.readdirSync(chatsDir);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return matches;
            }
            throw error;
        }
        const files = [];
        for (const name of fileNames) {
            if (!SESSION_FILE_PATTERN.test(name))
                continue;
            const filePath = path.join(chatsDir, name);
            try {
                const stats = fs.statSync(filePath);
                files.push({ name, mtime: stats.mtimeMs });
            }
            catch {
                continue;
            }
        }
        // Sort most-recent first, with filename as a stable tie-breaker so runs
        // are deterministic even when multiple files share an mtime.
        files.sort((a, b) => b.mtime - a.mtime || a.name.localeCompare(b.name));
        // Pool the tail-read buffer across files; the title scan in the loop
        // body is otherwise the dominant alloc cost when many candidates exist.
        const tailBuffer = Buffer.alloc(LITE_READ_BUF_SIZE);
        let filesProcessed = 0;
        for (const file of files) {
            if (filesProcessed >= MAX_FILES_TO_PROCESS)
                break;
            filesProcessed++;
            const filePath = path.join(chatsDir, file.name);
            // Cheap check first: tail-read the title and skip non-matches before
            // doing the full hydration work (first-record read, project filter,
            // prompt extraction).
            const titleInfo = this.readSessionTitleInfoFromFile(filePath, tailBuffer);
            if (titleInfo.title?.toLowerCase().trim() !== normalizedTitle)
                continue;
            const records = await jsonl.readLines(filePath, MAX_PROMPT_SCAN_LINES);
            if (records.length === 0)
                continue;
            const firstRecord = records[0];
            const recordProjectHash = getProjectHash(firstRecord.cwd);
            if (recordProjectHash !== this.projectHash)
                continue;
            const prompt = this.extractFirstPromptFromRecords(records);
            matches.push({
                sessionId: firstRecord.sessionId,
                cwd: firstRecord.cwd,
                startTime: firstRecord.timestamp,
                mtime: file.mtime,
                prompt,
                gitBranch: firstRecord.gitBranch,
                filePath,
                // messageCount intentionally omitted; see SessionListItem for
                // the rationale and `countSessionMessages` for on-demand use.
                customTitle: titleInfo.title,
                titleSource: titleInfo.source,
            });
        }
        return matches;
    }
    /**
     * Returns the customTitles in this project that start with `prefix`
     * (case-insensitive). Single project-wide scan — meant to replace
     * repeated `findSessionsByTitle()` probes when the caller needs to
     * pick the first free `(Branch N)` slot in memory.
     *
     * Skips the heavy hydration steps (message count, prompt extraction)
     * that `findSessionsByTitle` does — collision lookup only needs the
     * title and a project filter, so we read the first record only when
     * the title actually matches the prefix.
     *
     * @param prefix Case-insensitive title prefix to match.
     */
    async findSessionTitlesByPrefix(prefix) {
        const normalizedPrefix = prefix.toLowerCase().trim();
        const titles = [];
        const chatsDir = this.getChatsDir();
        let fileNames;
        try {
            fileNames = fs.readdirSync(chatsDir);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return titles;
            }
            throw error;
        }
        let filesProcessed = 0;
        for (const name of fileNames) {
            if (!SESSION_FILE_PATTERN.test(name))
                continue;
            if (filesProcessed >= MAX_FILES_TO_PROCESS)
                break;
            filesProcessed++;
            const filePath = path.join(chatsDir, name);
            // Cheap tail-read to extract the title before doing any project-
            // filter work. Saves a per-file jsonl.readLines on the common
            // case where most sessions don't share this prefix.
            const titleInfo = this.readSessionTitleInfoFromFile(filePath);
            if (!titleInfo.title)
                continue;
            const normalizedTitle = titleInfo.title.toLowerCase().trim();
            if (!normalizedTitle.startsWith(normalizedPrefix))
                continue;
            // Project filter — same semantics as findSessionsByTitle: scope
            // collisions to the current project so a fork in another project
            // can't make this one bump unnecessarily.
            try {
                const records = await jsonl.readLines(filePath, 1);
                if (records.length === 0)
                    continue;
                if (getProjectHash(records[0].cwd) !== this.projectHash)
                    continue;
            }
            catch {
                continue;
            }
            titles.push(titleInfo.title);
        }
        return titles;
    }
    /**
     * Loads the most recent session for the current project.
     * Combines listSessions and loadSession for convenience.
     *
     * @returns Session data for resumption, or undefined if no sessions exist
     */
    async loadLastSession() {
        const result = await this.listSessions({ size: 1 });
        if (result.items.length === 0) {
            return;
        }
        return this.loadSession(result.items[0].sessionId);
    }
    /**
     * Checks if a session exists by its session ID.
     *
     * @param sessionId The session ID to check
     * @returns true if session exists and belongs to current project
     */
    async sessionExists(sessionId) {
        if (!SESSION_FILE_PATTERN.test(`${sessionId}.jsonl`)) {
            return false;
        }
        const chatsDir = this.getChatsDir();
        const filePath = path.join(chatsDir, `${sessionId}.jsonl`);
        try {
            const records = await jsonl.readLines(filePath, 1);
            if (records.length === 0) {
                return false;
            }
            const recordProjectHash = getProjectHash(records[0].cwd);
            return recordProjectHash === this.projectHash;
        }
        catch {
            return false;
        }
    }
}
/**
 * Strips thought parts from a Content object.
 * Thought parts are identified by having `thought: true`.
 * Returns null if the content only contained thought parts.
 */
function stripThoughtsFromContent(content) {
    if (!content.parts)
        return content;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredParts = content.parts.filter((part) => !part.thought);
    // If all parts were thoughts, remove the entire content
    if (filteredParts.length === 0) {
        return null;
    }
    return {
        ...content,
        parts: filteredParts,
    };
}
function copyContentForApiHistory(content) {
    return {
        ...content,
        parts: content.parts?.map((part) => {
            if ('functionCall' in part && part.functionCall) {
                return {
                    ...part,
                    functionCall: {
                        ...part.functionCall,
                        args: part.functionCall.args
                            ? { ...part.functionCall.args }
                            : part.functionCall.args,
                    },
                };
            }
            if ('functionResponse' in part && part.functionResponse) {
                return {
                    ...part,
                    functionResponse: {
                        ...part.functionResponse,
                    },
                };
            }
            return { ...part };
        }),
    };
}
function appendApiHistoryRecord(history, record) {
    if (!record.message)
        return;
    const message = copyContentForApiHistory(record.message);
    if (record.subtype === 'mid_turn_user_message') {
        const previous = history.at(-1);
        if (previous?.role === 'user') {
            previous.parts = [...(previous.parts ?? []), ...(message.parts ?? [])];
            return;
        }
    }
    history.push(message);
}
/**
 * Builds the model-facing chat history (Content[]) from a reconstructed
 * conversation. This keeps UI history intact while applying chat compression
 * checkpoints for the API history used on resume.
 *
 * Strategy:
 * - Find the latest system/chat_compression record (if any).
 * - Use its compressedHistory snapshot as the base history.
 * - Append all messages after that checkpoint (skipping system records).
 * - If no checkpoint exists, return the linear message list (message field only).
 */
export function buildApiHistoryFromConversation(conversation, options = {}) {
    const { stripThoughtsFromHistory = false } = options;
    const { messages } = conversation;
    let lastCompressionIndex = -1;
    let compressedHistory;
    messages.forEach((record, index) => {
        if (record.type === 'system' && record.subtype === 'chat_compression') {
            const payload = record.systemPayload;
            if (payload?.compressedHistory) {
                lastCompressionIndex = index;
                compressedHistory = payload.compressedHistory;
            }
        }
    });
    if (compressedHistory && lastCompressionIndex >= 0) {
        const baseHistory = compressedHistory.map(copyContentForApiHistory);
        // Append everything after the compression record (newer turns)
        for (let i = lastCompressionIndex + 1; i < messages.length; i++) {
            const record = messages[i];
            if (record.type === 'system')
                continue;
            appendApiHistoryRecord(baseHistory, record);
        }
        if (stripThoughtsFromHistory) {
            return baseHistory
                .map(stripThoughtsFromContent)
                .filter((content) => content !== null);
        }
        return baseHistory;
    }
    // Fallback: return linear messages as Content[]
    const result = [];
    for (const record of messages) {
        appendApiHistoryRecord(result, record);
    }
    if (stripThoughtsFromHistory) {
        return result
            .map(stripThoughtsFromContent)
            .filter((content) => content !== null);
    }
    return result;
}
/**
 * Replays stored UI telemetry events to rebuild metrics when resuming a session.
 * Also restores the last prompt token count from the best available source.
 */
export function replayUiTelemetryFromConversation(conversation) {
    uiTelemetryService.reset();
    for (const record of conversation.messages) {
        if (record.type !== 'system' || record.subtype !== 'ui_telemetry') {
            continue;
        }
        const payload = record.systemPayload;
        const uiEvent = payload?.uiEvent;
        if (uiEvent) {
            uiTelemetryService.addEvent(uiEvent);
        }
    }
    const resumePromptTokens = getResumePromptTokenCount(conversation);
    if (resumePromptTokens !== undefined) {
        uiTelemetryService.setLastPromptTokenCount(resumePromptTokens);
    }
}
/**
 * Returns the best available prompt token count for resuming telemetry.
 * Walks backward through messages and returns the first valid value:
 * - The latest assistant's non-zero usage (promptTokenCount ?? totalTokenCount).
 * - The most recent chat compression checkpoint's newTokenCount.
 */
export function getResumePromptTokenCount(conversation) {
    for (let i = conversation.messages.length - 1; i >= 0; i--) {
        const record = conversation.messages[i];
        if (record.type === 'assistant') {
            const usage = record.usageMetadata;
            const candidate = usage?.promptTokenCount ?? usage?.totalTokenCount;
            if (candidate) {
                return candidate;
            }
        }
        if (record.type === 'system' && record.subtype === 'chat_compression') {
            const payload = record.systemPayload;
            if (payload?.info) {
                return payload.info.newTokenCount;
            }
        }
    }
    return undefined;
}
//# sourceMappingURL=sessionService.js.map