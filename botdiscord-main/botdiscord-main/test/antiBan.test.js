const assert = require("node:assert/strict");
const { test } = require("node:test");
const AntiBanEngine = require("../src/utils/antiBan");

function engine(options = {}) {
    const queue = new AntiBanEngine({ humanTyping: false, outboxIntervalMs: 25, ...options });
    queue.sleep = async () => {};
    return queue;
}

test("uses the installed Promise API once and preserves the reply ID", async () => {
    const queue = engine();
    const calls = [];
    const info = { messageID: "test-message" };
    const api = { sendMessage: async (...args) => { calls.push(args); return info; } };

    assert.equal(await queue.safeSendMessage(api, "hello", 123, " reply-id "), info);
    assert.deepEqual(calls, [["hello", "123", "reply-id"]]);
});

test("an ambiguous timeout is not retried without its reply ID", async () => {
    const queue = engine();
    const failure = Object.assign(new Error("Timed out after sending"), { code: "ETIMEDOUT" });
    let sends = 0;
    const api = { sendMessage: async () => { sends++; throw failure; } };

    await assert.rejects(queue.safeSendMessage(api, "hello", "thread", "reply"), error => error === failure);
    assert.equal(sends, 1);
    assert.equal(queue.outboxHaltCode, null);
});

test("a callback-only API is never probed by sending a second message", async () => {
    const queue = engine();
    let sends = 0;
    const api = { sendMessage: () => { sends++; } };

    await assert.rejects(queue.safeSendMessage(api, "hello", "thread"), { code: "OUTBOX_UNSUPPORTED_API" });
    assert.equal(sends, 1);
});

test("rate-limit and auth failures stop queued and future sends", async t => {
    const cases = [
        [Object.assign(new Error("rate limited"), { response: { status: 429 } }), "OUTBOX_RATE_LIMITED"],
        [new Error("parseAndCheckLogin got status code: 429. Bailing out of trying to parse response."), "OUTBOX_RATE_LIMITED"],
        [Object.assign(new Error("unauthorized"), { statusCode: 401 }), "OUTBOX_AUTH_REQUIRED"],
        [Object.assign(new Error("forbidden"), { status: 403 }), "OUTBOX_AUTH_REQUIRED"],
        [new Error("Facebook blocked the login"), "OUTBOX_AUTH_REQUIRED"],
        [{ error: "Not logged in." }, "OUTBOX_AUTH_REQUIRED"],
        [new Error("checkpoint required"), "OUTBOX_AUTH_REQUIRED"],
    ];

    for (const [failure, code] of cases) {
        await t.test(code + ": " + (failure.message || failure.error), async () => {
            const queue = engine();
            let sends = 0;
            const api = { sendMessage: async () => { sends++; throw failure; } };
            const first = queue.safeSendMessage(api, "first", "thread", "reply");
            const pending = queue.safeSendMessage(api, "pending", "thread");
            await Promise.all([
                assert.rejects(first, error => error === failure),
                assert.rejects(pending, { code }),
            ]);
            await assert.rejects(queue.safeSendMessage(api, "later", "thread"), { code });
            assert.equal(sends, 1);
            assert.equal(queue.outboxQueue.length, 0);
        });
    }
});

test("a full queue rejects additional work and retains FIFO order", async () => {
    const queue = engine({ maxOutboxQueueSize: 1 });
    const sent = [];
    let releaseFirst;
    let markStarted;
    const started = new Promise(resolve => { markStarted = resolve; });
    const api = {
        sendMessage: async text => {
            sent.push(text);
            if (text === "first") {
                markStarted();
                await new Promise(resolve => { releaseFirst = resolve; });
            }
            return { messageID: text };
        },
    };

    const first = queue.safeSendMessage(api, "first", "thread");
    await started;
    const second = queue.safeSendMessage(api, "second", "thread");
    await assert.rejects(queue.safeSendMessage(api, "overflow", "thread"), { code: "OUTBOX_FULL" });
    releaseFirst();
    await Promise.all([first, second]);
    assert.deepEqual(sent, ["first", "second"]);
});

test("a failed send still waits before starting the next queued send", async () => {
    const queue = engine();
    const events = [];
    queue.sleep = async ms => { if (ms === 25) events.push("interval"); };
    const api = {
        sendMessage: async text => {
            events.push(text);
            if (text === "first") throw new Error("network error");
            return { messageID: text };
        },
    };

    const first = queue.safeSendMessage(api, "first", "thread");
    const second = queue.safeSendMessage(api, "second", "thread");
    await Promise.all([assert.rejects(first, /network error/), second]);
    assert.deepEqual(events.slice(0, 3), ["first", "interval", "second"]);
});

test("rejects invalid queue capacity instead of allowing unbounded growth", () => {
    for (const maxOutboxQueueSize of [0, -1, 1.5, Infinity, "100"]) {
        assert.throws(() => engine({ maxOutboxQueueSize }), RangeError);
    }
});
