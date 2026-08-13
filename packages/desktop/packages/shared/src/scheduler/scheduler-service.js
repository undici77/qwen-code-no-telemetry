/**
 * SchedulerService - Emits SchedulerTick events every minute
 *
 * Aligned to minute boundaries for consistent timing.
 * Automations can subscribe using cron expressions in automations.json.
 */
export class SchedulerService {
    timer = null;
    alignmentTimer = null;
    isTicking = false;
    onTick;
    constructor(onTick) {
        this.onTick = onTick;
    }
    start() {
        if (this.timer || this.alignmentTimer)
            return;
        // Align to next minute boundary for consistent timing
        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        this.alignmentTimer = setTimeout(() => {
            this.alignmentTimer = null;
            this.tick();
            this.timer = setInterval(() => this.tick(), 60_000);
        }, msUntilNextMinute);
    }
    stop() {
        if (this.alignmentTimer) {
            clearTimeout(this.alignmentTimer);
            this.alignmentTimer = null;
        }
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async tick() {
        if (this.isTicking) {
            console.warn('[SchedulerService] Previous tick still running, skipping');
            return;
        }
        this.isTicking = true;
        try {
            const now = new Date();
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const payload = {
                timestamp: now.toISOString(),
                localTime: now.toTimeString().slice(0, 5), // HH:MM
                hour: now.getHours(),
                minute: now.getMinutes(),
                dayOfWeek: now.getDay(),
                dayName: days[now.getDay()], // getDay() always returns 0-6
            };
            console.log('[SchedulerService] TICK at', payload.localTime, 'UTC:', payload.timestamp);
            await this.onTick(payload);
            console.log('[SchedulerService] TICK callback completed');
        }
        catch (error) {
            console.error('[SchedulerService] Tick failed:', error);
        }
        finally {
            this.isTicking = false;
        }
    }
}
//# sourceMappingURL=scheduler-service.js.map