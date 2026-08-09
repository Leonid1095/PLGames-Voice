// Server permission model, mirroring the Rust implementation the API actually
// enforces. Kept in its own module so the calculation is unit-testable without
// standing up a WebSocket, an API or the rest of index.js.
//
// Reference:
//   server/crates/core/permissions/src/models/channel.rs   — the bits
//   server/crates/core/permissions/src/impl.rs             — calculate_server_permissions
//   server/crates/core/database/src/util/permissions.rs    — role ordering

// BigInt is not optional here: several bits sit above 2^31 and JavaScript's
// bitwise operators coerce their operands to *32-bit* integers, so `perms & X`
// on a plain Number silently truncates everything from ViewChannel upwards.
const PERMISSION = {
  ManageChannel: 1n << 0n,
  ManageServer: 1n << 1n,
  ManagePermissions: 1n << 2n,
  ManageRole: 1n << 3n,
  ManageCustomisation: 1n << 4n,
  KickMembers: 1n << 6n,
  BanMembers: 1n << 7n,
  TimeoutMembers: 1n << 8n,
  ViewChannel: 1n << 20n,
  ReadMessageHistory: 1n << 21n,
  ManageMessages: 1n << 23n,
  MoveMembers: 1n << 35n,
};

// ChannelPermission::GrantAllSafe — what the server hands the owner outright.
const GRANT_ALL_SAFE = 0x000f_ffff_ffff_ffffn;

// Permissions a member keeps while timed out. ALLOW_IN_TIMEOUT (channel.rs:122)
// is exactly ViewChannel + ReadMessageHistory — everything else is stripped, so
// a timed-out moderator cannot keep moderating through the bot.
const ALLOW_IN_TIMEOUT = PERMISSION.ViewChannel | PERMISSION.ReadMessageHistory;

/**
 * Compute a member's effective server permissions as a BigInt bitfield.
 *
 * Mirrors calculate_server_permissions(): start from the server's default
 * permissions, then apply each of the member's role overrides. The server sorts
 * roles by rank descending (permissions.rs:172), so the lowest rank number —
 * the most authoritative role — is applied last and wins.
 *
 * @param {object} server  as returned by GET /servers/:id
 * @param {object|null} member  as returned by GET /servers/:id/members/:id
 * @param {string} userId
 * @param {Date} [now]  injectable for tests
 * @returns {bigint|null} null when the user is not a member of the server
 */
function computeServerPermissions(server, member, userId, now = new Date()) {
  // The owner bypasses the whole calculation, same as are_we_server_owner().
  if (server && server.owner === userId) return GRANT_ALL_SAFE;
  if (!server || !member) return null;

  let permissions = BigInt(server.default_permissions ?? 0);

  const held = member.roles ?? [];
  const roles = Object.entries(server.roles ?? {})
    .filter(([id]) => held.includes(id))
    .map(([, role]) => role)
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));

  for (const role of roles) {
    permissions |= BigInt(role.permissions?.a ?? 0);
    permissions &= ~BigInt(role.permissions?.d ?? 0);
  }

  if (member.timeout && new Date(member.timeout) > now) {
    permissions &= ALLOW_IN_TIMEOUT;
  }

  return permissions;
}

/** Does this bitfield hold every one of the given permission bits? */
function holds(permissions, ...bits) {
  if (permissions === null || permissions === undefined) return false;
  return bits.every((bit) => (permissions & bit) === bit);
}

module.exports = {
  PERMISSION,
  GRANT_ALL_SAFE,
  ALLOW_IN_TIMEOUT,
  computeServerPermissions,
  holds,
};
