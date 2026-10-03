const test = require("node:test");
const assert = require("node:assert/strict");

const { levelForXp, cooledDown } = require("./xp");

test("level is floor of sqrt(xp / 100)", () => {
  assert.equal(levelForXp(0), 0);
  assert.equal(levelForXp(99), 0);
  assert.equal(levelForXp(100), 1);
  assert.equal(levelForXp(399), 1);
  assert.equal(levelForXp(400), 2);
  assert.equal(levelForXp(2500), 5);
});

test("negative and non-numeric xp stay at level 0", () => {
  assert.equal(levelForXp(-10), 0);
  assert.equal(levelForXp(Number.NaN), 0);
});

test("cooldown blocks a second award inside the window", () => {
  const now = 1_000_000;
  assert.equal(cooledDown(now, now - 4_999, 5), false);
  assert.equal(cooledDown(now, now - 5_000, 5), true);
  assert.equal(cooledDown(now, 0, 5), true);
});
