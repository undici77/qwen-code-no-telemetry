import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getGlobalQwenDir } from './paths.js';
// Alphabet without ambiguous chars: 0/O, 1/I
const SAFE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_PENDING = 3;
export class PairingStore {
    dir;
    pendingPath;
    allowlistPath;
    constructor(channelName) {
        this.dir = path.join(getGlobalQwenDir(), 'channels');
        this.pendingPath = path.join(this.dir, `${channelName}-pairing.json`);
        this.allowlistPath = path.join(this.dir, `${channelName}-allowlist.json`);
    }
    isApproved(senderId) {
        const list = this.readAllowlist();
        return list.includes(senderId);
    }
    /**
     * Create a pairing request for an unknown sender.
     * Returns the code if created, or null if the pending cap is reached.
     * If the sender already has a non-expired pending request, returns that code.
     */
    createRequest(senderId, senderName) {
        const pending = this.readPending();
        // Purge expired
        const now = Date.now();
        const active = pending.filter((r) => now - r.createdAt < EXPIRY_MS);
        // Check if sender already has a pending request
        const existing = active.find((r) => r.senderId === senderId);
        if (existing) {
            return existing.code;
        }
        // Cap check
        if (active.length >= MAX_PENDING) {
            return null;
        }
        const code = generateCode();
        active.push({ senderId, senderName, code, createdAt: now });
        this.writePending(active);
        return code;
    }
    /**
     * Approve a pairing request by code.
     * Returns the sender ID if found, or null if not found / expired.
     */
    approve(code) {
        const pending = this.readPending();
        const now = Date.now();
        const idx = pending.findIndex((r) => r.code === code.toUpperCase() && now - r.createdAt < EXPIRY_MS);
        if (idx === -1)
            return null;
        const request = pending[idx];
        pending.splice(idx, 1);
        this.writePending(pending);
        // Add to allowlist
        const list = this.readAllowlist();
        if (!list.includes(request.senderId)) {
            list.push(request.senderId);
            this.writeAllowlist(list);
        }
        return request;
    }
    listPending() {
        const pending = this.readPending();
        const now = Date.now();
        return pending.filter((r) => now - r.createdAt < EXPIRY_MS);
    }
    getAllowlist() {
        return this.readAllowlist();
    }
    ensureDir() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, { recursive: true });
        }
    }
    readPending() {
        try {
            const data = fs.readFileSync(this.pendingPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    writePending(requests) {
        this.ensureDir();
        fs.writeFileSync(this.pendingPath, JSON.stringify(requests, null, 2));
    }
    readAllowlist() {
        try {
            const data = fs.readFileSync(this.allowlistPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    writeAllowlist(list) {
        this.ensureDir();
        fs.writeFileSync(this.allowlistPath, JSON.stringify(list, null, 2));
    }
}
function generateCode() {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += SAFE_ALPHABET[crypto.randomInt(SAFE_ALPHABET.length)];
    }
    return code;
}
//# sourceMappingURL=PairingStore.js.map