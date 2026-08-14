"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  RowLink,
  ROW_HOVER_CLASS,
} from "@/components/listings/RowAffordance";
import { ROLE_SECTIONS, USERS_PAGE } from "@/constants/users";
import Link from "next/link";
import { useUsers } from "@/hooks/useUsers";
import UserDetailPanel from "./[role]/UserDetailPanel";

const PAGE_SIZE = 3;

function RoleSection({ role, label }: { role: string; label: string }) {
  const { users, isLoading, error } = useUsers(role, PAGE_SIZE);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <Link href={`/dashboard/users/${role}`}>{USERS_PAGE.viewAll}</Link>
        </Button>
      </div>
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
                  <RowLink>
                    <span className="text-sm font-medium">
                      {user.name} {user.last_name}
                    </span>
                  </RowLink>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  {user.establishments.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
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
                </span>
                <RowChevron className="shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}

      <UserDetailPanel
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {" "}
            {USERS_PAGE.title}{" "}
          </h1>
          <p className="text-muted-foreground text-sm">
            {" "}
            {USERS_PAGE.subtitle}{" "}
          </p>
        </div>

        <Separator />

        {ROLE_SECTIONS.map((section) => (
          <RoleSection key={section.role} {...section} />
        ))}
      </Card>
    </div>
  );
}
