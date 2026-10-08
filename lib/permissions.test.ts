import { describe, expect, it } from "vitest";
import { assignableRoles, can, Permission } from "@/lib/permissions";
import { ROLE_LABELS, UserRole } from "@/types/user";

const ADMIN_ONLY: Permission[] = [
  "requests.view",
  "users.view",
  "establishments.create",
  "establishments.requests.view",
  "users.invite",
  "users.revokeAccess",
  "surveys.delete",
];

describe("can", () => {
  it.each(["admin", "superadmin"] as const)(
    "grants %s every permission",
    (role) => {
      for (const permission of ADMIN_ONLY) {
        expect(can(role, permission)).toBe(true);
      }
    },
  );

  it("denies an analyst every access- and permission-granting capability", () => {
    for (const permission of ADMIN_ONLY) {
      expect(can("analyst", permission)).toBe(false);
    }
  });

  // Backoffice access for field workers is scoped to its own issue; until
  // then they hold nothing.
  it("denies a field worker every permission", () => {
    for (const permission of ADMIN_ONLY) {
      expect(can("field_worker", permission)).toBe(false);
    }
  });

  it("denies everything when the role is not resolved yet", () => {
    for (const permission of ADMIN_ONLY) {
      expect(can(null, permission)).toBe(false);
    }
  });

  // Guards against a new role landing in `UserRole` with no entry in the
  // permission table, which would throw rather than deny.
  it("answers for every known role", () => {
    const roles = Object.keys(ROLE_LABELS) as UserRole[];
    for (const role of roles) {
      expect(typeof can(role, "requests.view")).toBe("boolean");
    }
  });
});

describe("assignableRoles", () => {
  const cases: [UserRole | null, UserRole, UserRole[]][] = [
    ["superadmin", "field_worker", ["analyst", "admin"]],
    ["superadmin", "analyst", ["field_worker", "admin"]],
    ["superadmin", "admin", ["field_worker", "analyst"]],
    ["superadmin", "superadmin", []],
    ["admin", "field_worker", ["analyst", "admin"]],
    ["admin", "analyst", ["field_worker", "admin"]],
    ["admin", "admin", []],
    ["admin", "superadmin", []],
    ["analyst", "field_worker", []],
    ["analyst", "analyst", []],
    ["analyst", "admin", []],
    ["analyst", "superadmin", []],
    ["field_worker", "field_worker", []],
    ["field_worker", "analyst", []],
    ["field_worker", "admin", []],
    ["field_worker", "superadmin", []],
    [null, "field_worker", []],
    [null, "analyst", []],
  ];

  it.each(cases)("lets %s move a %s to %j", (actor, target, expected) => {
    expect(assignableRoles(actor, target)).toEqual(expected);
  });

  it("offers nothing while the target's role is unknown", () => {
    expect(assignableRoles("superadmin", undefined)).toEqual([]);
    expect(assignableRoles("superadmin", null)).toEqual([]);
  });
});
