const test = require("node:test");
const assert = require("node:assert/strict");

const { pushSpamTimestamp, duplicateStep } = require("./moderation");
const { normaliseForAutomod, stripMachineTokens } = require("./banned-words");

test("spam window forgets messages older than the window", () => {
  const now = 10_000;
  const kept = pushSpamTimestamp([now - 6_000, now - 1_000], now, 5_000);
  assert.deepEqual(kept, [now - 1_000, now]);
});

test("spam limit is the count after the current message is recorded", () => {
  const stamps = pushSpamTimestamp([1, 2, 3, 4], 5, 100);
  assert.equal(stamps.length >= 5, true);
});

test("the first copy of a message never trips the duplicate rule", () => {
  const first = duplicateStep({ lastContent: "", duplicateCount: 0 }, "hello", 1);
  assert.equal(first.tripped, false);
  assert.equal(first.duplicateCount, 1);
  const second = duplicateStep(first, "hello", 1);
  assert.equal(second.tripped, true);
  assert.equal(second.duplicateCount, 2);
});

test("a different message resets the streak", () => {
  const next = duplicateStep({ lastContent: "hello", duplicateCount: 4 }, "other", 3);
  assert.equal(next.tripped, false);
  assert.equal(next.lastContent, "other");
  assert.equal(next.duplicateCount, 1);
});

test("repeated letters still match the banned root after folding", () => {
  // й decomposes to и under NFD, and both the message and the root go
  // through the same function, so the match is on the folded form.
  assert.equal(normaliseForAutomod("хуууй"), normaliseForAutomod("хуй"));
  assert.ok(normaliseForAutomod("хуууй").includes(normaliseForAutomod("хуй")));
});

test("a GIF url is not matched as a stop-word", () => {
  const raw = "смотри https://media.tenor.com/m/dickH0lEabc/foo.gif";
  const stripped = stripMachineTokens(raw);
  const folded = normaliseForAutomod("dick");
  assert.equal(stripped.includes("http"), false);
  assert.equal(normaliseForAutomod(stripped).includes(folded), false);
  assert.equal(stripped.toLowerCase().includes("dick"), false);
});
