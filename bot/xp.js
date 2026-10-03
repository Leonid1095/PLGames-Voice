// XP curve used by the admin bot.
// level = floor(sqrt(xp / 100)), so 0 xp is level 0, 100 xp is level 1,
// 400 xp is level 2, 2500 xp is level 5. Kept here so the formula can be
// tested without booting the websocket client in index.js.

/**
 * @param {number} xp
 * @returns {number}
 */
function levelForXp(xp) {
  if (!Number.isFinite(xp) || xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * A message awards XP only after the cooldown since the previous award.
 * @param {number} now epoch ms
 * @param {number} lastXpTime epoch ms
 * @param {number} cooldownSeconds
 * @returns {boolean}
 */
function cooledDown(now, lastXpTime, cooldownSeconds) {
  const wait = Number(cooldownSeconds) * 1000;
  if (!Number.isFinite(wait) || wait < 0) return true;
  return now - lastXpTime >= wait;
}

module.exports = { levelForXp, cooledDown };
