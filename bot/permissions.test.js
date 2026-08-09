const test = require("node:test");
const assert = require("node:assert/strict");

const {
  PERMISSION,
  GRANT_ALL_SAFE,
  computeServerPermissions,
  holds,
} = require("./permissions");

// Shapes below are copied from live API responses, not invented:
//   GET /servers/01KJ3E82WMT4EEAJ4NMJ7H7V3Z
const ADMIN_ROLE_ALLOW = 549754781663; // grants ManageServer, Kick, Ban, Timeout, ManageMessages
const DEFAULT_PERMISSIONS = 77014766592; // grants none of the admin bits

const OWNER = "01KJ35G2G3QHPFDTW4R6HW3VN3";
const USER = "01KJ8CKVAXNPYRDH588SECNS64";

function server(overrides = {}) {
  return {
    _id: "01KJ3E82WMT4EEAJ4NMJ7H7V3Z",
    owner: OWNER,
    default_permissions: DEFAULT_PERMISSIONS,
    roles: {
      admin: { name: "Admin", permissions: { a: ADMIN_ROLE_ALLOW, d: 0 }, rank: 0 },
      cosmetic: { name: "Стример", permissions: { a: 0, d: 0 }, rank: 5 },
    },
    ...overrides,
  };
}

const member = (roles = [], extra = {}) => ({ _id: { user: USER }, roles, ...extra });

test("owner gets everything without needing a member record", () => {
  assert.equal(computeServerPermissions(server(), null, OWNER), GRANT_ALL_SAFE);
  assert.ok(holds(computeServerPermissions(server(), null, OWNER), PERMISSION.ManageServer));
});

test("member with no roles gets only the server defaults", () => {
  const perms = computeServerPermissions(server(), member([]), USER);
  assert.equal(perms, BigInt(DEFAULT_PERMISSIONS));
  assert.equal(holds(perms, PERMISSION.ManageServer), false);
  assert.equal(holds(perms, PERMISSION.KickMembers), false);
});

// This is the regression the whole change exists for (audit 2026-08-09, H3):
// the old check was `member.roles.length > 0`, which made this case an admin.
test("member with a purely cosmetic role is NOT an admin", () => {
  const perms = computeServerPermissions(server(), member(["cosmetic"]), USER);
  assert.equal(holds(perms, PERMISSION.ManageServer), false);
  assert.equal(holds(perms, PERMISSION.BanMembers), false);
  assert.equal(holds(perms, PERMISSION.ManageMessages), false);
});

test("member with the admin role is an admin", () => {
  const perms = computeServerPermissions(server(), member(["admin"]), USER);
  assert.ok(holds(perms, PERMISSION.ManageServer));
  assert.ok(holds(perms, PERMISSION.KickMembers, PERMISSION.BanMembers));
});

test("bits above 2^31 survive — the 32-bit truncation trap", () => {
  const perms = computeServerPermissions(server(), member(["admin"]), USER);
  // MoveMembers is bit 35. With Number bitwise ops this assertion fails.
  assert.ok(holds(perms, PERMISSION.MoveMembers));
  assert.ok(perms > 0xffffffffn);
});

test("a deny on a higher-ranked role overrides an allow on a lower one", () => {
  const s = server({
    roles: {
      // rank 0 is the most authoritative and is applied last.
      boss: { permissions: { a: 0, d: Number(PERMISSION.BanMembers) }, rank: 0 },
      mod: { permissions: { a: ADMIN_ROLE_ALLOW, d: 0 }, rank: 5 },
    },
  });
  const perms = computeServerPermissions(s, member(["mod", "boss"]), USER);
  assert.equal(holds(perms, PERMISSION.BanMembers), false, "deny from rank 0 must win");
  assert.ok(holds(perms, PERMISSION.KickMembers), "unrelated grants stay");
});

test("an active timeout strips everything but view + history", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const perms = computeServerPermissions(
    server(),
    member(["admin"], { timeout: future }),
    USER,
  );
  assert.equal(holds(perms, PERMISSION.ManageServer), false);
  assert.equal(holds(perms, PERMISSION.BanMembers), false);
  assert.ok(holds(perms, PERMISSION.ViewChannel, PERMISSION.ReadMessageHistory));
});

test("an expired timeout does not strip anything", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const perms = computeServerPermissions(server(), member(["admin"], { timeout: past }), USER);
  assert.ok(holds(perms, PERMISSION.ManageServer));
});

test("a non-member resolves to null and holds() denies", () => {
  assert.equal(computeServerPermissions(server(), null, USER), null);
  assert.equal(holds(null, PERMISSION.ManageServer), false);
  assert.equal(holds(undefined, PERMISSION.ManageServer), false);
});

test("roles the member does not hold are ignored", () => {
  const perms = computeServerPermissions(server(), member(["nonexistent"]), USER);
  assert.equal(perms, BigInt(DEFAULT_PERMISSIONS));
});

test("holds() requires every requested bit, not any", () => {
  const perms = computeServerPermissions(server(), member(["admin"]), USER);
  assert.ok(holds(perms, PERMISSION.KickMembers, PERMISSION.BanMembers));
  // ManageServer is granted, bit 39 is not — the pair must fail.
  assert.equal(holds(perms, PERMISSION.ManageServer, 1n << 39n), false);
});
