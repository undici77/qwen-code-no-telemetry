export declare class Stream<T> implements AsyncIterable<T> {
    private returned;
    private queue;
    private readResolve;
    private readReject;
    private isDone;
    hasError: Error | undefined;
    private started;
    constructor(returned?: () => void);
    [Symbol.asyncIterator](): AsyncIterator<T>;
    next(): Promise<IteratorResult<T>>;
    enqueue(value: T): void;
    done(): void;
    error(error: Error): void;
    return(): Promise<IteratorResult<T>>;
}
