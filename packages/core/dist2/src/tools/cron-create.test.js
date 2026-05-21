import { describe, it, expect, beforeEach } from 'vitest';
import { CronCreateTool } from './cron-create.js';
import { CronScheduler } from '../services/cronScheduler.js';
function makeConfig() {
    const scheduler = new CronScheduler();
    return {
        getCronScheduler: () => scheduler,
        _scheduler: scheduler,
    };
}
describe('CronCreateTool', () => {
    let config;
    let tool;
    beforeEach(() => {
        config = makeConfig();
        tool = new CronCreateTool(config);
    });
    it('has the correct name', () => {
        expect(tool.name).toBe('cron_create');
    });
    it('creates a recurring job by default', async () => {
        const invocation = tool.build({
            cron: '*/5 * * * *',
            prompt: 'check status',
        });
        const result = await invocation.execute(new AbortController().signal);
        expect(result.error).toBeUndefined();
        expect(result.llmContent).toContain('Scheduled recurring job');
        expect(result.llmContent).toContain('Auto-expires after 3 days');
        expect(config._scheduler.list()).toHaveLength(1);
    });
    it('creates a one-shot job when recurring=false', async () => {
        const invocation = tool.build({
            cron: '*/1 * * * *',
            prompt: 'once',
            recurring: false,
        });
        const result = await invocation.execute(new AbortController().signal);
        expect(result.error).toBeUndefined();
        expect(result.llmContent).toContain('Scheduled one-shot task');
        expect(result.llmContent).toContain('fire once then auto-delete');
        const jobs = config._scheduler.list();
        expect(jobs).toHaveLength(1);
        expect(jobs[0].recurring).toBe(false);
    });
    it('returns error for invalid cron expression', async () => {
        const invocation = tool.build({
            cron: 'bad cron',
            prompt: 'fail',
        });
        const result = await invocation.execute(new AbortController().signal);
        expect(result.error).toBeDefined();
    });
    it('validates required params', () => {
        expect(() => tool.build({ cron: '*/1 * * * *' })).toThrow();
        expect(() => tool.build({ prompt: 'test' })).toThrow();
    });
});
//# sourceMappingURL=cron-create.test.js.map