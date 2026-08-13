import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export class ChannelLoopStore {
    filePath;
    now;
    idFactory;
    pendingUpdate = Promise.resolve();
    constructor(options) {
        this.filePath = options.filePath;
        this.now = options.now ?? (() => new Date());
        this.idFactory = options.idFactory ?? (() => crypto.randomUUID());
    }
    async list() {
        return this.readJobs();
    }
    async listForTarget(channelName, target) {
        const jobs = await this.readJobs();
        return jobs.filter((job) => job.channelName === channelName && sameTarget(job.target, target));
    }
    async create(input) {
        let job;
        await this.updateJobs((jobs) => {
            job = this.buildLoop(input, jobs);
            return [...jobs, job];
        });
        if (!job)
            throw new Error('Failed to create channel loop.');
        return job;
    }
    async createForTarget(input, maxEnabledLoops) {
        let created;
        await this.updateJobs((jobs) => {
            const enabledForTarget = jobs.filter((job) => job.enabled &&
                job.channelName === input.channelName &&
                sameTarget(job.target, input.target)).length;
            if (enabledForTarget >= maxEnabledLoops) {
                return jobs;
            }
            const job = this.buildLoop(input, jobs);
            created = job;
            return [...jobs, job];
        });
        return created;
    }
    async update(id, patch) {
        let found = false;
        await this.updateJobs((jobs) => jobs.map((job) => {
            if (job.id !== id)
                return job;
            found = true;
            return { ...job, ...patch };
        }));
        return found;
    }
    async disable(id) {
        return this.update(id, { enabled: false });
    }
    buildLoop(input, existingLoops) {
        const existingIds = new Set(existingLoops.map((loop) => loop.id));
        const baseId = this.idFactory();
        let id = baseId;
        let suffix = 1;
        while (existingIds.has(id)) {
            id = `${baseId}-${suffix++}`;
        }
        return {
            ...input,
            id,
            target: normalizeTarget(input.target),
            enabled: true,
            createdAt: this.now().toISOString(),
            consecutiveFailures: 0,
            runCount: 0,
        };
    }
    async updateJobs(mutate) {
        const nextUpdate = this.pendingUpdate.then(async () => {
            const jobs = await this.readJobs();
            await this.writeJobs(mutate(jobs));
        });
        this.pendingUpdate = nextUpdate.catch(() => { });
        await nextUpdate;
    }
    async readJobs() {
        let raw;
        try {
            raw = await fs.readFile(this.filePath, 'utf8');
        }
        catch (err) {
            if (err.code === 'ENOENT')
                return [];
            throw err;
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new Error(`Malformed JSON in ${this.filePath}; fix or delete the file.`);
        }
        if (!Array.isArray(parsed)) {
            throw new Error(`Expected a JSON array in ${this.filePath}; fix or delete the file.`);
        }
        const jobs = [];
        for (const [index, value] of parsed.entries()) {
            if (!isChannelLoop(value)) {
                process.stderr.write(`Invalid channel loop at index ${index} in ${this.filePath}: ${JSON.stringify(value)}\n`);
                continue;
            }
            jobs.push(normalizeJob(value));
        }
        return jobs;
    }
    async writeJobs(jobs) {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true, mode: 0o700 });
        await fs.chmod(dir, 0o700).catch(() => { });
        const tmpPath = `${this.filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
        try {
            await fs.writeFile(tmpPath, JSON.stringify(jobs, null, 2), {
                encoding: 'utf8',
                mode: 0o600,
            });
            await fs.rename(tmpPath, this.filePath);
            await fs.chmod(this.filePath, 0o600).catch(() => { });
        }
        catch (err) {
            await fs.rm(tmpPath, { force: true }).catch(() => { });
            throw err;
        }
    }
}
function sameTarget(a, b) {
    return (a.channelName === b.channelName &&
        a.senderId === b.senderId &&
        a.chatId === b.chatId &&
        a.threadId === b.threadId);
}
function normalizeTarget(target) {
    return {
        ...target,
        isGroup: target.isGroup === undefined ? undefined : target.isGroup === true,
    };
}
function isSessionTarget(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const target = value;
    return (typeof target['channelName'] === 'string' &&
        typeof target['senderId'] === 'string' &&
        typeof target['chatId'] === 'string' &&
        (target['threadId'] === undefined ||
            typeof target['threadId'] === 'string') &&
        (target['isGroup'] === undefined || typeof target['isGroup'] === 'boolean'));
}
function isChannelLoop(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const job = value;
    return (typeof job['id'] === 'string' &&
        typeof job['channelName'] === 'string' &&
        isSessionTarget(job['target']) &&
        typeof job['cwd'] === 'string' &&
        typeof job['cron'] === 'string' &&
        typeof job['prompt'] === 'string' &&
        (job['label'] === undefined || typeof job['label'] === 'string') &&
        typeof job['recurring'] === 'boolean' &&
        typeof job['enabled'] === 'boolean' &&
        typeof job['createdBy'] === 'string' &&
        typeof job['createdAt'] === 'string' &&
        (job['lastFiredAt'] === undefined ||
            typeof job['lastFiredAt'] === 'string') &&
        (job['lastFinishedAt'] === undefined ||
            typeof job['lastFinishedAt'] === 'string') &&
        (job['lastResultPreview'] === undefined ||
            typeof job['lastResultPreview'] === 'string') &&
        (job['lastStatus'] === undefined ||
            job['lastStatus'] === 'ok' ||
            job['lastStatus'] === 'error') &&
        (job['lastError'] === undefined || typeof job['lastError'] === 'string') &&
        typeof job['consecutiveFailures'] === 'number' &&
        (job['runningSince'] === undefined ||
            typeof job['runningSince'] === 'string') &&
        (job['runCount'] === undefined || typeof job['runCount'] === 'number'));
}
function normalizeJob(job) {
    return {
        ...job,
        target: normalizeTarget(job.target),
        runCount: job.runCount ?? 0,
    };
}
//# sourceMappingURL=ChannelLoopStore.js.map