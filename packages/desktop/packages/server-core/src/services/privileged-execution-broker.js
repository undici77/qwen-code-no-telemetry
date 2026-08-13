import { createHash } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
const DEFAULT_APPROVAL_TTL_SECONDS = 120;
const AUDIT_LOG_PATH = join(homedir(), '.craft-agent', 'logs', 'privileged-actions.jsonl');
/**
 * PrivilegedExecutionBroker
 *
 * Owns privileged-execution approval binding and auditing.
 * Execution itself is delegated to backend tool execution paths.
 */
export class PrivilegedExecutionBroker {
    logger;
    pending = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    createRequest(input) {
        const now = Date.now();
        const ttl = input.approvalTtlSeconds ?? DEFAULT_APPROVAL_TTL_SECONDS;
        const policy = this.validatePolicy(input.command);
        const request = {
            requestId: input.requestId,
            sessionId: input.sessionId,
            command: input.command,
            commandHash: this.hashCommand(input.command),
            reason: input.reason,
            impact: input.impact,
            approvalTtlSeconds: ttl,
            createdAt: now,
            expiresAt: now + ttl * 1000,
            policyAllowed: policy.allowed,
            policyReason: policy.reason,
        };
        this.pending.set(input.requestId, request);
        void this.appendAudit({
            event: 'privileged_request_created',
            requestId: request.requestId,
            sessionId: request.sessionId,
            commandHash: request.commandHash,
            command: request.command,
            policyAllowed: request.policyAllowed,
            policyReason: request.policyReason,
            createdAt: request.createdAt,
            expiresAt: request.expiresAt,
        });
        return request;
    }
    resolveApproval(requestId, approved, options) {
        const request = this.pending.get(requestId);
        if (!request) {
            return { ok: false, reason: 'No pending privileged request found' };
        }
        this.pending.delete(requestId);
        if (options?.expectedCommandHash && options.expectedCommandHash !== request.commandHash) {
            void this.appendAudit({
                event: 'privileged_request_hash_mismatch',
                requestId: request.requestId,
                sessionId: request.sessionId,
                expectedCommandHash: options.expectedCommandHash,
                actualCommandHash: request.commandHash,
            });
            return { ok: false, reason: 'Command hash mismatch for privileged approval request' };
        }
        if (!request.policyAllowed) {
            void this.appendAudit({
                event: 'privileged_request_blocked_by_policy',
                requestId: request.requestId,
                sessionId: request.sessionId,
                commandHash: request.commandHash,
                policyReason: request.policyReason,
            });
            return { ok: false, reason: request.policyReason ?? 'Command is not allowed by privileged policy' };
        }
        if (Date.now() > request.expiresAt) {
            void this.appendAudit({
                event: 'privileged_request_expired',
                requestId: request.requestId,
                sessionId: request.sessionId,
                commandHash: request.commandHash,
                expiresAt: request.expiresAt,
            });
            return { ok: false, reason: 'Privileged approval request expired' };
        }
        void this.appendAudit({
            event: approved ? 'privileged_request_approved' : 'privileged_request_denied',
            requestId: request.requestId,
            sessionId: request.sessionId,
            commandHash: request.commandHash,
            resolvedAt: Date.now(),
        });
        return {
            ok: true,
            request: {
                requestId: request.requestId,
                sessionId: request.sessionId,
                command: request.command,
                commandHash: request.commandHash,
                reason: request.reason,
                impact: request.impact,
                approvalTtlSeconds: request.approvalTtlSeconds,
                createdAt: request.createdAt,
                expiresAt: request.expiresAt,
            },
        };
    }
    hashCommand(command) {
        return createHash('sha256').update(command, 'utf8').digest('hex');
    }
    validatePolicy(command) {
        const normalized = command.trim().toLowerCase();
        const allowlisted = /^brew\s+install\s+--cask\s+/.test(normalized) ||
            /^brew\s+upgrade\s+--cask\s+/.test(normalized) ||
            /^installer\s+-pkg\s+.+\s+-target\s+\//.test(normalized);
        if (!allowlisted) {
            return {
                allowed: false,
                reason: 'Privileged execution policy only allows brew cask install/upgrade and installer -pkg -target / commands',
            };
        }
        return { allowed: true };
    }
    auditEvent(event, payload) {
        void this.appendAudit({ event, ...payload });
    }
    async appendAudit(payload) {
        try {
            await mkdir(dirname(AUDIT_LOG_PATH), { recursive: true });
            await appendFile(AUDIT_LOG_PATH, `${JSON.stringify({ timestamp: new Date().toISOString(), ...payload })}\n`, 'utf8');
        }
        catch (error) {
            this.logger.warn('[PrivilegedExecutionBroker] Failed to write audit log:', error);
        }
    }
}
//# sourceMappingURL=privileged-execution-broker.js.map