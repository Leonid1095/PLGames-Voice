// Pure pieces of automod that index.js used to keep inline.
// The spam window and the duplicate streak must stay identical to the
// previous handler: the first time a text is seen it never trips, and a
// timestamp counts only while it is still inside the window.

/**
 * Drop timestamps older than the window and append `now`.
 * @param {number[]} timestamps
 * @param {number} now
 * @param {number} windowMs
 * @returns {number[]}
 */
function pushSpamTimestamp(timestamps, now, windowMs) {
  const kept = (timestamps || []).filter((ts) => now - ts < windowMs);
  kept.push(now);
  return kept;
}

/**
 * @param {{ lastContent: string, duplicateCount: number }} state
 * @param {string} key already-lowercased full message
 * @param {number} maxDuplicates
 * @returns {{ lastContent: string, duplicateCount: number, tripped: boolean }}
 */
function duplicateStep(state, key, maxDuplicates) {
  if (key === state.lastContent) {
    const duplicateCount = state.duplicateCount + 1;
    return {
      lastContent: state.lastContent,
      duplicateCount,
      tripped: duplicateCount >= maxDuplicates,
    };
  }
  return { lastContent: key, duplicateCount: 1, tripped: false };
}

module.exports = { pushSpamTimestamp, duplicateStep };
