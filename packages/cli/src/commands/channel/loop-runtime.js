import { nextFireTime, parseCron } from '@qwen-code/qwen-code-core';
export function createChannelLoopController(store) {
    return {
        create: (input) => store.create(input),
        createForTarget: (input, maxEnabledLoops) => store.createForTarget(input, maxEnabledLoops),
        listForTarget: (channelName, target) => store.listForTarget(channelName, target),
        disable: (id) => store.disable(id),
        validateCron: (cron) => {
            parseCron(cron);
            nextFireTime(cron, new Date());
        },
        nextFireTime: (job) => nextFireTime(job.cron, new Date(job.lastFiredAt ?? job.createdAt)),
    };
}
export function isChannelCronEnabled(settings) {
    if (process.env['QWEN_CODE_DISABLE_CRON'] === '1')
        return false;
    return settings.merged.experimental?.cron !== false;
}
//# sourceMappingURL=loop-runtime.js.map