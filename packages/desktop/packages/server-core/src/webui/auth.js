/**
 * Web UI session authentication.
 *
 * Cookie-based JWT session auth for the browser-served web UI.
 * - Login: verify password → issue signed JWT → set HttpOnly cookie
 * - Validation: check cookie on every HTTP request + WebSocket upgrade
 * - Rate limiting: per-IP brute-force protection on /api/auth
 */
import { SignJWT, jwtVerify } from 'jose';
// ---------------------------------------------------------------------------
// JWT helpers (via jose library)
// ---------------------------------------------------------------------------
const JWT_EXPIRY_SECONDS = 86_400; // 24 hours
export async function signJwt(payload, secret) {
    const key = new TextEncoder().encode(secret);
    return new SignJWT({ sub: payload.sub })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(payload.iat)
        .setExpirationTime(payload.exp)
        .sign(key);
}
export async function verifyJwt(token, secret) {
    try {
        const key = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return {
            sub: payload.sub,
            iat: payload.iat,
            exp: payload.exp,
        };
    }
    catch {
        return null;
    }
}
export async function createSessionToken(secret) {
    const now = Math.floor(Date.now() / 1000);
    return signJwt({ sub: 'webui', iat: now, exp: now + JWT_EXPIRY_SECONDS }, secret);
}
// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
const SESSION_COOKIE_NAME = 'craft_session';
export function buildSessionCookie(jwt, secure) {
    const parts = [
        `${SESSION_COOKIE_NAME}=${jwt}`,
        'HttpOnly',
        'SameSite=Strict',
        'Path=/',
        `Max-Age=${JWT_EXPIRY_SECONDS}`,
    ];
    if (secure)
        parts.push('Secure');
    return parts.join('; ');
}
export function buildLogoutCookie(secure = false) {
    const parts = [
        `${SESSION_COOKIE_NAME}=`,
        'HttpOnly',
        'SameSite=Strict',
        'Path=/',
        'Max-Age=0',
    ];
    if (secure)
        parts.push('Secure');
    return parts.join('; ');
}
export function extractSessionCookie(cookieHeader) {
    if (!cookieHeader)
        return null;
    for (const pair of cookieHeader.split(';')) {
        const [name, ...rest] = pair.trim().split('=');
        if (name === SESSION_COOKIE_NAME)
            return rest.join('=');
    }
    return null;
}
// ---------------------------------------------------------------------------
// Password verification (argon2id via Bun.password)
// ---------------------------------------------------------------------------
let hashedPassword = null;
/**
 * Hash the login password at startup. Must be called before any auth requests.
 * The hash is stored in memory — the raw password is not retained.
 */
export async function initPasswordHash(plaintext) {
    hashedPassword = await Bun.password.hash(plaintext, { algorithm: 'argon2id' });
}
/**
 * Verify a user-supplied password against the pre-hashed password.
 * Uses Bun's built-in argon2id verification (constant-time).
 */
export async function verifyPassword(input) {
    if (!hashedPassword)
        return false;
    return Bun.password.verify(input, hashedPassword);
}
export class RateLimiter {
    entries = new Map();
    maxAttempts;
    windowMs;
    /** Global counter — blocks all IPs after too many total failures (defeats IP spoofing). */
    maxGlobalAttempts;
    globalAttempts = 0;
    globalWindowStart = Date.now();
    constructor(maxAttempts = 5, windowMs = 60_000, maxGlobalAttempts = 20) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.maxGlobalAttempts = maxGlobalAttempts;
    }
    /** Returns true if the request should be allowed, false if rate-limited. */
    check(ip) {
        const now = Date.now();
        // Reset global window if expired
        if (now - this.globalWindowStart > this.windowMs) {
            this.globalAttempts = 0;
            this.globalWindowStart = now;
        }
        // Global rate limit — blocks everyone if too many total attempts
        this.globalAttempts++;
        if (this.globalAttempts > this.maxGlobalAttempts)
            return false;
        // Per-IP rate limit
        const entry = this.entries.get(ip);
        if (!entry || now - entry.windowStart > this.windowMs) {
            this.entries.set(ip, { attempts: 1, windowStart: now });
            return true;
        }
        entry.attempts++;
        if (entry.attempts > this.maxAttempts)
            return false;
        return true;
    }
    /** Periodic cleanup of stale entries (call on a timer). */
    cleanup() {
        const now = Date.now();
        for (const [ip, entry] of this.entries) {
            if (now - entry.windowStart > this.windowMs * 2) {
                this.entries.delete(ip);
            }
        }
    }
}
// ---------------------------------------------------------------------------
// Session validator (used by both HTTP and WebSocket)
// ---------------------------------------------------------------------------
export async function validateSession(cookieHeader, secret) {
    const token = extractSessionCookie(cookieHeader);
    if (!token)
        return null;
    return verifyJwt(token, secret);
}
//# sourceMappingURL=auth.js.map