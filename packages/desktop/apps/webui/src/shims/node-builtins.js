/**
 * Empty shims for Node.js built-in modules.
 *
 * The shared code (@craft-agent/shared) imports Node.js modules for
 * file system operations, but these codepaths are only reached on the server.
 * In the browser, the web API adapter intercepts all calls before they
 * reach server-side code.
 *
 * These shims satisfy the bundler's static analysis without adding runtime bulk.
 */
// fs
export const readFileSync = () => { throw new Error('readFileSync not available in browser'); };
export const writeFileSync = () => { throw new Error('writeFileSync not available in browser'); };
export const existsSync = () => false;
export const statSync = () => { throw new Error('statSync not available in browser'); };
export const unlinkSync = () => { };
export const mkdtempSync = () => '';
export const renameSync = () => { };
export const mkdirSync = () => { };
export const readdirSync = () => [];
export const readdir = () => { };
export const copyFileSync = () => { };
export const promises = {
    readFile: async () => { throw new Error('fs.promises not available in browser'); },
    writeFile: async () => { throw new Error('fs.promises not available in browser'); },
    mkdir: async () => { },
    readdir: async () => [],
    stat: async () => { throw new Error('fs.promises not available in browser'); },
    access: async () => { throw new Error('fs.promises not available in browser'); },
    rm: async () => { },
    unlink: async () => { },
};
// path
export const join = (...parts) => parts.filter(Boolean).join('/');
export const resolve = (...parts) => parts.filter(Boolean).join('/');
export const basename = (p) => p.split('/').pop() ?? '';
export const dirname = (p) => p.split('/').slice(0, -1).join('/');
export const extname = (p) => { const m = p.match(/\.[^.]+$/); return m ? m[0] : ''; };
export const relative = (from, to) => to;
export const sep = '/';
export const isAbsolute = (p) => p.startsWith('/');
export const normalize = (p) => p;
export const parse = (p) => ({ root: '', dir: dirname(p), base: basename(p), ext: extname(p), name: basename(p).replace(/\.[^.]+$/, '') });
export const format = (obj) => [obj.dir, obj.base].filter(Boolean).join('/');
export const posix = { join, resolve, basename, dirname, extname, relative, sep, isAbsolute, normalize, parse, format };
export const win32 = posix;
// child_process
export const execSync = () => { throw new Error('execSync not available in browser'); };
export const exec = () => { throw new Error('exec not available in browser'); };
export const spawn = () => { throw new Error('spawn not available in browser'); };
// os
export const homedir = () => '/home/user';
export const tmpdir = () => '/tmp';
export const platform = () => 'linux';
export const hostname = () => 'browser';
export const cpus = () => [{}];
// crypto (basic) — delegate to Web Crypto where possible
export const randomBytes = (n) => {
    const buf = new Uint8Array(n);
    globalThis.crypto.getRandomValues(buf);
    return buf;
};
export const randomUUID = () => globalThis.crypto.randomUUID();
export const createHash = () => ({
    update: function () { return this; },
    digest: () => '',
});
export const createHmac = () => ({
    update: function () { return this; },
    digest: () => '',
});
export const timingSafeEqual = (a, b) => {
    if (a.length !== b.length)
        return false;
    let result = 0;
    for (let i = 0; i < a.length; i++)
        result |= a[i] ^ b[i];
    return result === 0;
};
// https / http — server code imported but never executed in browser
export const createServer = () => { throw new Error('createServer not available in browser'); };
export const request = () => { throw new Error('request not available in browser'); };
export const get = () => { throw new Error('get not available in browser'); };
// util
export const promisify = (fn) => fn;
export const inspect = (obj) => String(obj);
export const deprecate = (fn) => fn;
export const inherits = () => { };
// buffer
export const Buffer = {
    from: (data) => new Uint8Array(typeof data === 'string' ? new TextEncoder().encode(data) : data),
    isBuffer: () => false,
    alloc: (size) => new Uint8Array(size),
    concat: (bufs) => {
        const total = bufs.reduce((acc, b) => acc + b.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        for (const buf of bufs) {
            result.set(buf, offset);
            offset += buf.length;
        }
        return result;
    },
};
// process
export const env = typeof globalThis.process !== 'undefined' ? globalThis.process.env : {};
export const cwd = () => '/';
export const argv = [];
export const pid = 0;
export const kill = () => { };
export const exit = () => { };
export const on = () => { };
// Events — WebSocketServer imports EventEmitter
export class EventEmitter {
    _events = {};
    on(event, fn) { (this._events[event] ??= []).push(fn); return this; }
    off(event, fn) { this._events[event] = (this._events[event] ?? []).filter(f => f !== fn); return this; }
    emit(event, ...args) { (this._events[event] ?? []).forEach(fn => fn(...args)); return true; }
    removeAllListeners() { this._events = {}; return this; }
    addListener(event, fn) { return this.on(event, fn); }
    removeListener(event, fn) { return this.off(event, fn); }
    listeners(event) { return this._events[event] ?? []; }
}
export default {};
//# sourceMappingURL=node-builtins.js.map