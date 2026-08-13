import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync, statSync, } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSourceTest } from './source-test.ts';
function createCtx(workspacePath, overrides = {}) {
    const saved = {};
    const ctx = {
        sessionId: 'test-session',
        workspacePath,
        get sourcesPath() {
            return join(workspacePath, 'sources');
        },
        get skillsPath() {
            return join(workspacePath, 'skills');
        },
        plansFolderPath: join(workspacePath, 'plans'),
        callbacks: {
            onPlanSubmitted: () => { },
            onAuthRequest: () => { },
        },
        fs: {
            exists: (path) => existsSync(path),
            readFile: (path) => readFileSync(path, 'utf-8'),
            readFileBuffer: (path) => readFileSync(path),
            writeFile: (path, content) => writeFileSync(path, content),
            isDirectory: (path) => existsSync(path) && statSync(path).isDirectory(),
            readdir: (path) => readdirSync(path),
            stat: (path) => {
                const s = statSync(path);
                return { size: s.size, isDirectory: () => s.isDirectory() };
            },
        },
        loadSourceConfig: (slug) => {
            const configPath = join(workspacePath, 'sources', slug, 'config.json');
            if (!existsSync(configPath))
                return null;
            return JSON.parse(readFileSync(configPath, 'utf-8'));
        },
        saveSourceConfig: (source) => {
            saved.last = source;
            const configPath = join(workspacePath, 'sources', source.slug, 'config.json');
            writeFileSync(configPath, JSON.stringify(source, null, 2));
        },
        // Stub the MCP validator so connection tests don't hit the network.
        validateStdioMcpConnection: overrides.validateStdioMcpConnection,
        activateSourceInSession: overrides.activateSourceInSession,
    };
    // Expose saved for assertions (test-only — not on real ctx).
    ctx._saved = saved;
    return ctx;
}
function writeSource(workspacePath, slug, overrides = {}) {
    const sourcePath = join(workspacePath, 'sources', slug);
    mkdirSync(sourcePath, { recursive: true });
    const config = {
        id: slug,
        slug,
        name: `Test ${slug}`,
        enabled: true,
        provider: 'test',
        type: 'mcp',
        tagline: 'A test source',
        icon: '🧪',
        mcp: {
            transport: 'stdio',
            command: 'echo',
            args: ['ok'],
        },
        ...overrides,
    };
    writeFileSync(join(sourcePath, 'config.json'), JSON.stringify(config, null, 2));
    writeFileSync(join(sourcePath, 'guide.md'), '# Guide\n\nThis is a longer guide with more than fifty words so the validator does not warn about the guide being too short for the readability criteria the tool enforces when evaluating source completeness for this test suite which is only here to exercise the auto-enable flow and not the completeness check.');
}
function stubMcpOk() {
    return async () => ({
        success: true,
        toolCount: 1,
        toolNames: ['dummy'],
        serverName: 'stub',
        serverVersion: '0.0.0',
    });
}
function stubMcpFail() {
    return async () => ({ success: false, error: 'boom' });
}
describe('source_test auto-enable', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'source-test-auto-enable-'));
    });
    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });
    it('flips enabled: false → true and calls activation callback on clean run', async () => {
        writeSource(tempDir, 'craft-kb', { enabled: false });
        let activated = null;
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
            activateSourceInSession: async (slug) => {
                activated = slug;
                return { ok: true, availability: 'next-turn' };
            },
        });
        const result = await handleSourceTest(ctx, { sourceSlug: 'craft-kb' });
        const text = result.content[0]?.text ?? '';
        expect(text).toContain('Source auto-enabled in config');
        expect(text).toContain('turn will auto-restart');
        expect(activated).toBe('craft-kb');
        const persisted = JSON.parse(readFileSync(join(tempDir, 'sources', 'craft-kb', 'config.json'), 'utf-8'));
        expect(persisted.enabled).toBe(true);
    });
    it('already-enabled source still calls activation callback (session may be stale)', async () => {
        writeSource(tempDir, 'craft-kb', { enabled: true });
        let activated = null;
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
            activateSourceInSession: async (slug) => {
                activated = slug;
                return { ok: true, availability: 'next-turn' };
            },
        });
        const result = await handleSourceTest(ctx, { sourceSlug: 'craft-kb' });
        const text = result.content[0]?.text ?? '';
        // No "auto-enabled in config" line because enabled was already true.
        expect(text).not.toContain('auto-enabled in config');
        expect(activated).toBe('craft-kb');
        expect(text).toContain('turn will auto-restart');
    });
    it('autoEnable: false skips both the flag flip and the activation callback', async () => {
        writeSource(tempDir, 'craft-kb', { enabled: false });
        let activated = false;
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
            activateSourceInSession: async () => {
                activated = true;
                return { ok: true };
            },
        });
        await handleSourceTest(ctx, { sourceSlug: 'craft-kb', autoEnable: false });
        expect(activated).toBe(false);
        const persisted = JSON.parse(readFileSync(join(tempDir, 'sources', 'craft-kb', 'config.json'), 'utf-8'));
        // saveSourceConfig still runs (metadata update), but enabled flag must remain false.
        expect(persisted.enabled).toBe(false);
    });
    it('validation errors skip auto-enable entirely (even when autoEnable is default)', async () => {
        writeSource(tempDir, 'broken', { enabled: false });
        let activated = false;
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpFail(),
            activateSourceInSession: async () => {
                activated = true;
                return { ok: true };
            },
        });
        const result = await handleSourceTest(ctx, { sourceSlug: 'broken' });
        const text = result.content[0]?.text ?? '';
        expect(result.isError).toBe(true);
        expect(activated).toBe(false);
        expect(text).not.toContain('auto-enabled in config');
        const persisted = JSON.parse(readFileSync(join(tempDir, 'sources', 'broken', 'config.json'), 'utf-8'));
        expect(persisted.enabled).toBe(false);
    });
    it('without activateSourceInSession, flag flip still happens with restart hint', async () => {
        writeSource(tempDir, 'craft-kb', { enabled: false });
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
            // activateSourceInSession intentionally undefined
        });
        const result = await handleSourceTest(ctx, { sourceSlug: 'craft-kb' });
        const text = result.content[0]?.text ?? '';
        expect(text).toContain('auto-enabled in config');
        expect(text).toContain('Restart session to load tools');
        const persisted = JSON.parse(readFileSync(join(tempDir, 'sources', 'craft-kb', 'config.json'), 'utf-8'));
        expect(persisted.enabled).toBe(true);
    });
    it('activation failure shows warning but still persists enabled flag', async () => {
        writeSource(tempDir, 'craft-kb', { enabled: false });
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
            activateSourceInSession: async () => ({ ok: false, reason: 'build failed' }),
        });
        const result = await handleSourceTest(ctx, { sourceSlug: 'craft-kb' });
        const text = result.content[0]?.text ?? '';
        expect(text).toContain('session activation failed: build failed');
        const persisted = JSON.parse(readFileSync(join(tempDir, 'sources', 'craft-kb', 'config.json'), 'utf-8'));
        expect(persisted.enabled).toBe(true);
    });
    it('successful activation reports a single auto-restart message (backend-agnostic)', async () => {
        writeSource(tempDir, 'craft-kb', { enabled: true });
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
            activateSourceInSession: async () => ({ ok: true, availability: 'next-turn' }),
        });
        const result = await handleSourceTest(ctx, { sourceSlug: 'craft-kb' });
        const text = result.content[0]?.text ?? '';
        // Both backends route through the same source_activated + auto_retry machinery
        // now, so the user-visible message is one line.
        expect(text).toContain('turn will auto-restart');
        expect(text).not.toContain('tools available now');
        expect(text).not.toContain('available on your next message');
    });
    it('uses the requested source slug for guide checks when config slug is legacy-formatted', async () => {
        writeSource(tempDir, 'my-source', { slug: 'my--source' });
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
        });
        const result = await handleSourceTest(ctx, {
            sourceSlug: 'my-source',
            autoEnable: false,
        });
        const text = result.content[0]?.text ?? '';
        expect(text).toContain('guide.md exists');
        expect(text).toContain('Validation passed');
        expect(result.isError).toBe(false);
    });
    it('uses the requested source slug for missing guide warnings when config slug is legacy-formatted', async () => {
        writeSource(tempDir, 'my-source', { slug: 'my--source' });
        rmSync(join(tempDir, 'sources', 'my-source', 'guide.md'), { force: true });
        const ctx = createCtx(tempDir, {
            validateStdioMcpConnection: stubMcpOk(),
        });
        const result = await handleSourceTest(ctx, {
            sourceSlug: 'my-source',
            autoEnable: false,
        });
        const text = result.content[0]?.text ?? '';
        expect(text).toContain('No guide.md file');
        expect(text).not.toContain('Invalid source slug: "my--source"');
        expect(result.isError).toBe(false);
    });
});
//# sourceMappingURL=source-test.test.js.map