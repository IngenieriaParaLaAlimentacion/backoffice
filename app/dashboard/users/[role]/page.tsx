"use client";

import RequirePermission from "@/components/RequirePermission";
import { use, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  RowLink,
  ROW_HOVER_CLASS,
} from "@/components/listings/RowAffordance";
import {
  ROLE_SECTIONS,
  USER_STATUS_FILTER_OPTIONS,
  UserStatusFilter,
  USERS_PAGE,
} from "@/constants/users";
import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { cn } from "@/lib/utils";
import UserEstablishments from "../UserEstablishments";
import RoleInviteButton from "../RoleInviteButton";
import UserStatusBadge from "../UserStatusBadge";
import UserDetailPanel from "./UserDetailPanel";
import { SELECT_CLASS } from "@/constants/common";

const PAGE_SIZE = 20;

function RoleUsersPage({ params }: { params: Promise<{ role: string }> }) {
  // `role` is the route param — which list is being shown, not who is looking.
  const { role } = use(params);
  const section = ROLE_SECTIONS.find((s) => s.role === role);
  const label = section?.label ?? role;

  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const { users, page, totalPages, isLoading, error, setPage, refetch } =
    useUsers(role, PAGE_SIZE, statusFilter);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <Link
          href="/dashboard/users"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft size={16} />
          Usuarios
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{label}</h1>
            <p className="text-muted-foreground text-sm">
              {USERS_PAGE.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <label htmlFor="users-status-filter" className="sr-only">
              {USERS_PAGE.statusFilterLabel}
            </label>
            <select
              id="users-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatusFilter);
                setPage(1);
              }}
              className={cn(SELECT_CLASS, "h-7 w-36")}
            >
              {USER_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <RoleInviteButton role={role} />
          </div>
        </div>

        <Separator />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {USERS_PAGE.noUsers}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="w-1/4 px-4 py-3 font-medium">
                      {USERS_PAGE.columns.name}
                    </th>
                    <th className="w-1/3 px-4 py-3 font-medium">
                      {USERS_PAGE.columns.email}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {USERS_PAGE.columns.establishments}
                    </th>
                    <th className="w-28 px-4 py-3 font-medium">
                      {USERS_PAGE.columns.status}
                    </th>
                    <ChevronHeaderCell className="w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`${ROW_HOVER_CLASS} bg-card`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <RowLink>
                          {user.name} {user.last_name}
                        </RowLink>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <UserEstablishments
                          establishments={user.establishments}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <ChevronCell className="w-12" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-left ${CARD_HOVER_CLASS} bg-card`}
                >
                  <span className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <RowLink>
                        <span className="text-sm font-medium">
                          {user.name} {user.last_name}
                        </span>
                      </RowLink>
                      {user.status !== "active" && (
                        <UserStatusBadge status={user.status} />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    {user.establishments.length > 0 && (
                      <UserEstablishments
                        establishments={user.establishments}
                        className="mt-1"
                      />
                    )}
                  </span>
                  <RowChevron className="shrink-0" />
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span>{USERS_PAGE.pagination(page, totalPages)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <UserDetailPanel
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUserChanged={refetch}
      />
    </div>
  );
}

export default function RoleUsersPageRoute({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  return (
    <RequirePermission permission="users.view">
      <RoleUsersPage params={params} />
    </RequirePermission>
  );
}
