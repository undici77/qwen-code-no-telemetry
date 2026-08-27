const OUTPUT_START_DELAY_SECONDS = 0.01;
export function scheduleOutputFrame(currentTime, outputCursor, duration) {
    const startAt = Math.max(currentTime + OUTPUT_START_DELAY_SECONDS, outputCursor);
    const endAt = startAt + duration;
    return { startAt, endAt };
}
//# sourceMappingURL=audio-output-queue.js.map