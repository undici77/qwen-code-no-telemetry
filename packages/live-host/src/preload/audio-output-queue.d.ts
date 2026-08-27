export type OutputFrameSchedule = {
    startAt: number;
    endAt: number;
};
export declare function scheduleOutputFrame(currentTime: number, outputCursor: number, duration: number): OutputFrameSchedule;
