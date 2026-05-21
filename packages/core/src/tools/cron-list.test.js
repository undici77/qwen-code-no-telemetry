import { describe, it, expect, beforeEach } from 'vitest';
import { CronListTool } from './cron-list.js';
import { CronScheduler } from '../services/cronScheduler.js';
function makeConfig() {
    const scheduler = new CronScheduler();
    return {
        getCronScheduler: () => scheduler,
        _scheduler: scheduler,
    };
}
describe('CronListTool', () => {
    let config;
    let tool;
    beforeEach(() => {
        config = makeConfig();
        tool = new CronListTool(config);
    });
    it('has the correct name', () => {
        expect(tool.name).toBe('cron_list');
    });
    it('returns empty message when no jobs', async () => {
        const invocation = tool.build({});
        const result = await invocation.execute(new AbortController().signal);
        expect(result.error).toBeUndefined();
        expect(result.llmContent).toContain('No active cron jobs');
    });
    it('lists created jobs', async () => {
        config._scheduler.create('*/5 * * * *', 'check build', true);
        config._scheduler.create('*/1 * * * *', 'ping', false);
        const invocation = tool.build({});
        const result = await invocation.execute(new AbortController().signal);
        expect(result.error).toBeUndefined();
        expect(result.llmContent).toContain('(recurring) [session-only]: check build');
        expect(result.llmContent).toContain('(one-shot) [session-only]: ping');
        // Two lines, one per job
        expect(String(result.llmContent).split('\n')).toHaveLength(2);
    });
});
//# sourceMappingURL=cron-list.test.js.map