/**
 * Unit tests for the API renew endpoint token refresh feature.
 *
 * Tests the token substitution helpers and the doRefresh() routing
 * for sources with renewEndpoint configuration.
 */
import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { SourceCredentialManager } from '../credential-manager.ts';
// Mock credentials module — track set() calls to verify saves
let setCalls = [];
const mockGet = mock(() => Promise.resolve(null));
mock.module('../../credentials/index.ts', () => ({
    getCredentialManager: () => ({
        set: (...args) => { setCalls.push(args); return Promise.resolve(); },
        get: mockGet,
        delete: mock(() => Promise.resolve()),
    }),
}));
function createRenewSource(overrides = {}) {
    const config = {
        id: 'test-id',
        name: 'Test Source',
        slug: 'test-source',
        enabled: true,
        provider: 'custom-api',
        type: 'api',
        isAuthenticated: true,
        api: {
            baseUrl: 'https://api.example.com',
            authType: 'bearer',
            renewEndpoint: { path: '/auth/refresh' },
        },
        ...overrides,
    };
    return {
        config,
        guide: null,
        folderPath: '/mock/path',
        workspaceRootPath: '/mock/workspace',
        workspaceId: 'mock-workspace',
    };
}
// Capture fetch calls
let fetchCalls = [];
function mockFetch(responseBody, status = 200) {
    fetchCalls = [];
    globalThis.fetch = (async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        fetchCalls.push({ url, init: init ?? {} });
        return new Response(JSON.stringify(responseBody), { status, headers: { 'Content-Type': 'application/json' } });
    });
}
function mockFetchText(text, status) {
    fetchCalls = [];
    globalThis.fetch = (async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        fetchCalls.push({ url, init: init ?? {} });
        return new Response(text, { status });
    });
}
describe('refreshApiRenew via refresh()', () => {
    let credManager;
    let originalFetch;
    beforeEach(() => {
        credManager = new SourceCredentialManager();
        originalFetch = globalThis.fetch;
        setCalls = [];
        fetchCalls = [];
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });
    test('calls renew endpoint and saves new token', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ access_token: 'new-token', expires_in: 3600 });
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                renewEndpoint: {
                    path: '/auth/refresh',
                    method: 'POST',
                    tokenField: 'access_token',
                    expiresInField: 'expires_in',
                },
            },
        });
        const result = await credManager.refresh(source);
        expect(result).toBe('new-token');
        expect(fetchCalls[0].url).toBe('https://api.example.com/auth/refresh');
        expect(setCalls.length).toBeGreaterThan(0);
    });
    test('uses custom token and expiry field names', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ jwt: 'jwt-token-xyz', ttl: 7200 });
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                renewEndpoint: { path: '/api/token/renew', tokenField: 'jwt', expiresInField: 'ttl' },
            },
        });
        expect(await credManager.refresh(source)).toBe('jwt-token-xyz');
    });
    test('substitutes {{token}} in body', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'current-access-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ access_token: 'new-token', expires_in: 3600 });
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                renewEndpoint: {
                    path: '/auth/refresh',
                    body: { token: '{{token}}', grant_type: 'refresh' },
                },
            },
        });
        await credManager.refresh(source);
        const body = JSON.parse(fetchCalls[0].init.body);
        expect(body.token).toBe('current-access-token');
        expect(body.grant_type).toBe('refresh');
    });
    test('handles absolute renew URL', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ access_token: 'new-token', expires_in: 3600 });
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                renewEndpoint: { path: 'https://auth.example.com/oauth/token' },
            },
        });
        await credManager.refresh(source);
        expect(fetchCalls[0].url).toBe('https://auth.example.com/oauth/token');
    });
    test('handles absolute renew URL with uppercase scheme', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ access_token: 'new-token', expires_in: 3600 });
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                renewEndpoint: { path: 'HTTPS://auth.example.com/oauth/token' },
            },
        });
        await credManager.refresh(source);
        expect(fetchCalls[0].url).toBe('HTTPS://auth.example.com/oauth/token');
    });
    test('returns null on 401 response', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetchText('Unauthorized', 401);
        const source = createRenewSource();
        expect(await credManager.refresh(source)).toBeNull();
    });
    test('uses fallbackTtlSecs when response has no expiry', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ access_token: 'new-token' }); // no expires_in
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                renewEndpoint: { path: '/auth/refresh', fallbackTtlSecs: 1800 },
            },
        });
        expect(await credManager.refresh(source)).toBe('new-token');
        // Verify expiresAt was set using fallbackTtlSecs
        const savedCred = setCalls[0]?.[1];
        expect(savedCred?.expiresAt).toBeDefined();
        const expectedExpiry = Date.now() + 1800 * 1000;
        expect(Math.abs((savedCred?.expiresAt ?? 0) - expectedExpiry)).toBeLessThan(5000);
    });
    test('merges defaultHeaders into renew request', async () => {
        mockGet.mockImplementationOnce(() => Promise.resolve({
            value: 'old-token', expiresAt: Date.now() - 60_000,
        }));
        mockFetch({ access_token: 'new-token', expires_in: 3600 });
        const source = createRenewSource({
            api: {
                baseUrl: 'https://api.example.com',
                authType: 'bearer',
                defaultHeaders: { 'X-Tenant-ID': 'acme-corp' },
                renewEndpoint: { path: '/auth/refresh' },
            },
        });
        await credManager.refresh(source);
        const headers = fetchCalls[0].init.headers;
        expect(headers['X-Tenant-ID']).toBe('acme-corp');
        expect(headers['Authorization']).toBe('Bearer old-token');
    });
});
//# sourceMappingURL=credential-manager-renew.test.js.map