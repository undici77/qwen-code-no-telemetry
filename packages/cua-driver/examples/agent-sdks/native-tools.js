/** Narrow agent-tool adapter over the same-process Cua Driver TypeScript SDK. */
import { randomUUID } from 'node:crypto';
import { CaptureScope, ClickButton, ClickInput, CuaDriver, DesktopScope, EndSessionInput, GetDesktopStateInput, PressKeyInput, StartSessionInput, ToolResult, TypeTextInput, } from '@trycua/cua-driver';
export class NativeDesktopTools {
    timeoutMs;
    driver = CuaDriver.create(undefined);
    session = `claude-native-${randomUUID().slice(0, 12)}`;
    started = false;
    constructor(timeoutMs = 30_000) {
        this.timeoutMs = timeoutMs;
    }
    async start() {
        await this.bounded(this.driver.startSession(StartSessionInput.new({
            session: this.session,
            captureScope: CaptureScope.Desktop,
        })), 'start_session');
        this.started = true;
    }
    async close() {
        try {
            if (this.started) {
                await this.bounded(this.driver.endSession(EndSessionInput.new({ session: this.session })), 'end_session');
                this.started = false;
            }
        }
        finally {
            try {
                await this.driver.shutdown();
            }
            finally {
                // Generated UniFFI bindings expose deterministic handle release
                // separately from asynchronous runtime shutdown.
                this.driver.uniffiDestroy();
            }
        }
    }
    async observe() {
        const result = await this.bounded(this.driver.getDesktopState(GetDesktopStateInput.new({ session: this.session })), 'get_desktop_state');
        return this.content(result);
    }
    async click(x, y) {
        return await this.mutateThenObserve(() => this.driver.click(ClickInput.new({
            x,
            y,
            scope: DesktopScope.Desktop,
            session: this.session,
            button: ClickButton.Left,
            count: 1,
        })));
    }
    async typeText(text) {
        return await this.mutateThenObserve(() => this.driver.typeText(TypeTextInput.new({
            text,
            scope: DesktopScope.Desktop,
            session: this.session,
        })));
    }
    async pressKey(key) {
        return await this.mutateThenObserve(() => this.driver.pressKey(PressKeyInput.new({
            key,
            scope: DesktopScope.Desktop,
            session: this.session,
        })));
    }
    async mutateThenObserve(operation) {
        let unknownDetail;
        try {
            const result = await this.bounded(operation(), 'desktop action');
            if (result.isError) {
                unknownDetail =
                    `Action reported an error and its outcome may be unknown (${result.text}). ` +
                        'A fresh observation follows. Do not retry until the observation proves ' +
                        'the action did not land.';
            }
        }
        catch (error) {
            unknownDetail =
                `Action outcome is unknown (${String(error)}). A fresh observation follows. ` +
                    'Do not retry until the observation proves the action did not land.';
        }
        const observation = await this.observe();
        if (unknownDetail) {
            observation.content.unshift({ type: 'text', text: unknownDetail });
        }
        return observation;
    }
    async bounded(operation, label) {
        let timer;
        try {
            return await Promise.race([
                operation,
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error(`${label} timed out`)), this.timeoutMs);
                }),
            ]);
        }
        finally {
            if (timer !== undefined)
                clearTimeout(timer);
        }
    }
    content(result) {
        return {
            content: [
                { type: 'text', text: result.text },
                ...result.images.map((image) => ({
                    type: 'image',
                    data: image.dataBase64,
                    mimeType: image.mimeType,
                })),
            ],
            isError: result.isError,
        };
    }
}
//# sourceMappingURL=native-tools.js.map