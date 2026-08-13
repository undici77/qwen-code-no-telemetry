export class Stream {
    returned;
    queue = [];
    readResolve;
    readReject;
    isDone = false;
    hasError;
    started = false;
    constructor(returned) {
        this.returned = returned;
    }
    [Symbol.asyncIterator]() {
        if (this.started) {
            throw new Error('Stream can only be iterated once');
        }
        this.started = true;
        return this;
    }
    async next() {
        if (this.queue.length > 0) {
            return Promise.resolve({
                done: false,
                value: this.queue.shift(),
            });
        }
        if (this.hasError) {
            return Promise.reject(this.hasError);
        }
        if (this.isDone) {
            return Promise.resolve({ done: true, value: undefined });
        }
        return new Promise((resolve, reject) => {
            this.readResolve = resolve;
            this.readReject = reject;
        });
    }
    enqueue(value) {
        if (this.readResolve) {
            const resolve = this.readResolve;
            this.readResolve = undefined;
            this.readReject = undefined;
            resolve({ done: false, value });
        }
        else {
            this.queue.push(value);
        }
    }
    done() {
        this.isDone = true;
        if (this.readResolve) {
            const resolve = this.readResolve;
            this.readResolve = undefined;
            this.readReject = undefined;
            resolve({ done: true, value: undefined });
        }
    }
    error(error) {
        this.hasError = error;
        if (this.readReject) {
            const reject = this.readReject;
            this.readResolve = undefined;
            this.readReject = undefined;
            reject(error);
        }
    }
    return() {
        this.isDone = true;
        // Settle any pending next() promise so awaiters don't hang forever.
        if (this.readResolve) {
            const resolve = this.readResolve;
            this.readResolve = undefined;
            this.readReject = undefined;
            resolve({ done: true, value: undefined });
        }
        if (this.returned) {
            this.returned();
        }
        return Promise.resolve({ done: true, value: undefined });
    }
}
//# sourceMappingURL=Stream.js.map