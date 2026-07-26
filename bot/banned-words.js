// Default profanity roots for automod.
// Match is substring-against-normalised content (see normaliseForAutomod):
//   - lowercased
//   - Cyrillic-look-alikes mapped from Latin (a→а, e→е, o→о, p→р, etc.)
//   - common leetspeak digits/symbols mapped to letters (0→о, 3→е, @→а, $→s)
//   - non-alphanumeric stripped
//   - repeated letters collapsed ("хуууй" → "хуй")
// So the root list only needs to cover canonical forms, not every variant.

module.exports = {
  /** Russian profanity roots (cover most derived forms) */
  ru: [
    "хуй", "хуя", "хуе",
    "пизд", "пезд",
    "ебат", "ебал", "ебан", "ебут", "ебуч", "выебт", "наеб",
    "бляд", "блят",
    "сука", "суки", "сучк",
    "пидор", "педор", "пидар", "педик",
    "мудак", "мудил",
    "хер", "хрен",
    "залуп",
    "гондон", "гнид",
    "уебок", "уеба",
    "дроч",
    "шлюх",
  ],

  /** English profanity (kept short, mostly to catch obvious cases) */
  en: [
    "fuck", "fck", "shit", "sht",
    "bitch", "btch",
    "asshole", "asswipe",
    "cunt",
    "dick", "cock",
    "pussy", "twat",
    "nigger", "faggot",
    "motherfucker",
    "bullshit",
    "bastard",
  ],
};

/**
 * Normalise content for substring matching against the banned-word roots.
 * Converts homoglyphs, leetspeak, collapses repeats. Pure function — safe to
 * call on every incoming message.
 *
 * @param {string} input raw message content
 * @returns {string} normalised content (lowercase, mostly Cyrillic letters)
 */
function normaliseForAutomod(input) {
  if (!input) return "";
  let s = String(input).toLowerCase();

  // Strip combining marks / accents.
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Latin → Cyrillic look-alike replacements + common leetspeak.
  const map = {
    a: "а", b: "б", c: "с", d: "д", e: "е", g: "г", h: "н", i: "и",
    j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р",
    s: "с", t: "т", u: "у", v: "в", w: "ш", x: "х", y: "у", z: "з",
    "0": "о", "1": "и", "3": "з", "4": "ч", "5": "с", "6": "б",
    "7": "т", "8": "в", "9": "д",
    "@": "а", "$": "с", "+": "т", "|": "и",
    "ё": "е",
  };
  s = s.replace(/[a-z0-9@$+|ё]/g, (c) => map[c] ?? c);

  // Drop everything that isn't a letter or space (zalgo, punctuation, etc).
  s = s.replace(/[^а-я ]+/g, "");

  // Collapse repeated letters: "хуууй" → "хуй".
  s = s.replace(/(.)\1{1,}/g, "$1");

  // Drop ALL whitespace so spaced-out bypasses ("F U C K") collapse
  // before matching. Trade-off: rare false positives if two unrelated
  // words combine into a banned substring; admin can drop any false
  // positive with !automod removeword <word>.
  s = s.replace(/\s+/g, "");

  return s;
}

module.exports.normaliseForAutomod = normaliseForAutomod;

/**
 * Remove machine-generated tokens before stop-word matching.
 *
 * normaliseForAutomod deliberately strips punctuation and collapses repeats,
 * so it can catch "х у у у й". The cost is that it turns any random ID into a
 * dense letter soup, and matching is substring-based — so a Tenor URL like
 * .../m/dickH0lEabc/ folds to something containing "fck" and the message gets
 * deleted. That is not hypothetical: two of four sample GIF links tripped the
 * filter, which is why sending a GIF read as three strikes and earned a mute.
 *
 * None of these tokens are human-written, so none of them can be profanity a
 * user chose to post. They are removed before both the raw and normalised
 * checks; everything the person actually typed is still matched exactly as
 * before.
 */
function stripMachineTokens(input) {
  if (!input) return "";
  return String(input)
    // links (markdown or bare), which is where GIF and image IDs live
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    // <@ULID> mentions, <#ULID> channel links, :ULID: custom emoji
    .replace(/<[@#][^>]{1,64}>/g, " ")
    .replace(/:[0-9A-HJKMNP-TV-Z]{26}:/gi, " ")
    // bare ULIDs pasted on their own (invite codes, ids)
    .replace(/[0-9A-HJKMNP-TV-Z]{26}/gi, " ");
}

module.exports.stripMachineTokens = stripMachineTokens;

/**
 * Combined default list (ru + en).
 */
module.exports.defaultBannedWords = [...module.exports.ru, ...module.exports.en];
