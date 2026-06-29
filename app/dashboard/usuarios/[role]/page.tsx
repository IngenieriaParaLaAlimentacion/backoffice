"use client";

import { use, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ROLE_SECTIONS, USERS_PAGE } from "@/constants/users";
import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";
import InviteUserDialog from "./InviteUserDialog";
import UserDetailPanel from "./UserDetailPanel";
import {
  inviteAdminAction,
  inviteAnalystAction,
} from "@/services/admin.service";

const PAGE_SIZE = 20;

export default function RoleUsersPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = use(params);
  const section = ROLE_SECTIONS.find((s) => s.role === role);
  const label = section?.label ?? role;

  const { users, page, totalPages, isLoading, error, setPage } = useUsers(
    role,
    PAGE_SIZE,
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <Link
          href="/dashboard/usuarios"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft size={16} />
          Usuarios
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">{label}</h1>
            <p className="text-muted-foreground text-sm">
              {USERS_PAGE.subtitle}
            </p>
          </div>
          {role === "admin" && (
            <InviteUserDialog
              label="Invitar administrador"
              inviteAction={inviteAdminAction}
            />
          )}
          {role === "analyst" && (
            <InviteUserDialog
              label="Invitar analista"
              inviteAction={inviteAnalystAction}
            />
          )}
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
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {USERS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {USERS_PAGE.columns.email}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {USERS_PAGE.columns.establishments}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className="bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium">
                        {user.name} {user.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        {user.establishments.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {user.establishments.map((est) => (
                              <span key={est.id} className="text-xs">
                                <span className="font-medium">{est.name}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  — {est.formatted_address}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      />
    </div>
  );
}
