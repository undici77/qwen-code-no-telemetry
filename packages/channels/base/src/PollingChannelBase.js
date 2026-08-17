import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { ChannelBase } from './ChannelBase.js';
import { getGlobalQwenDir } from './paths.js';
const INITIAL_BACKOFF = 2_000;
const MAX_BACKOFF = 30_000;
export class PollingChannelBase extends ChannelBase {
  cursor;
  abortController = new AbortController();
  running = false;
  consecutiveErrors = 0;
  abortableSleep(ms) {
    const signal = this.abortController.signal;
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        resolve();
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }
  constructor(name, config, bridge, options) {
    super(name, config, bridge, options);
    this.cursor = this.loadCursorFromDisk() ?? this.createInitialCursor();
  }
  validateCursor(parsed) {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return null;
    return parsed;
  }
  get pollInterval() {
    const configured = this.config.pollInterval;
    if (
      typeof configured === 'number' &&
      Number.isFinite(configured) &&
      configured > 0
    ) {
      return configured;
    }
    return 60_000;
  }
  saveCursor() {
    const path = this.cursorPath();
    mkdirSync(join(getGlobalQwenDir(), 'channels'), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.cursor) + '\n', 'utf-8');
    renameSync(tmp, path);
  }
  startPollLoop() {
    if (this.running) return;
    this.running = true;
    this.consecutiveErrors = 0;
    this.abortController = new AbortController();
    this.runLoop();
  }
  stopPollLoop() {
    this.running = false;
    this.abortController.abort();
  }
  async runLoop() {
    const signal = this.abortController.signal;
    while (this.running && !signal.aborted) {
      try {
        await this.pollOnce();
        this.saveCursor();
        this.consecutiveErrors = 0;
      } catch (err) {
        this.consecutiveErrors++;
        const backoff = Math.min(
          INITIAL_BACKOFF * 2 ** (this.consecutiveErrors - 1),
          MAX_BACKOFF,
        );
        process.stderr.write(
          `[Channel:${this.name}] poll error (attempt ${this.consecutiveErrors}), backing off ${backoff}ms: ${err}\n`,
        );
        await this.abortableSleep(backoff);
        continue;
      }
      await this.abortableSleep(this.pollInterval);
    }
  }
  loadCursorFromDisk() {
    try {
      const raw = readFileSync(this.cursorPath(), 'utf-8').trim();
      if (!raw) return null;
      return this.validateCursor(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  cursorPath() {
    const encoded = this.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 200);
    const hash = createHash('sha256')
      .update(this.name)
      .digest('hex')
      .slice(0, 16);
    return join(
      getGlobalQwenDir(),
      'channels',
      `${encoded}-${hash}-poll-cursor.json`,
    );
  }
}
//# sourceMappingURL=PollingChannelBase.js.map
