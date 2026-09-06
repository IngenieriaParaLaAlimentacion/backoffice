"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listUsersAction } from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import {
  CARD_HOVER_CLASS,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import UserRequestReviewPanel from "./UserRequestReviewPanel";
import { useRefreshRequestCounts } from "./layout";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { PENDING_REQUESTS_PAGE } from "@/constants/users";
import { getErrorMessage } from "@/lib/errorMessages";

const PAGE_SIZE = 20;

export default function RequestsPage() {
  const { makeAuthorizedRequest } = useAuth();
  const refreshCounts = useRefreshRequestCounts();

  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserAdminView | null>(null);

  const fetchUsers = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listUsersAction(makeAuthorizedRequest, {
          status: "pending_validation",
          page: currentPage,
          page_size: PAGE_SIZE,
          role: "field_worker",
        });
        setUsers(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          getErrorMessage(err, { fallback: PENDING_REQUESTS_PAGE.loadError }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const handleResolved = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setSelectedUser(null);
    refreshCounts();
  };

  return (
    <>
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">
            {PENDING_REQUESTS_PAGE.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {PENDING_REQUESTS_PAGE.subtitle}
          </p>
        </div>

        <Separator />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            {PENDING_REQUESTS_PAGE.noRequests}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {PENDING_REQUESTS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {PENDING_REQUESTS_PAGE.columns.email}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {PENDING_REQUESTS_PAGE.columns.establishments}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {PENDING_REQUESTS_PAGE.columns.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={`${ROW_HOVER_CLASS} ${rowStateClass(isSelected)}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {user.name} {user.last_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.establishments.length}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => setSelectedUser(user)}
                            >
                              <ClipboardCheck size={14} />
                              {PENDING_REQUESTS_PAGE.review}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {users.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} ${rowStateClass(isSelected)}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {user.name} {user.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {PENDING_REQUESTS_PAGE.establishmentsCount(
                          user.establishments.length,
                        )}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => setSelectedUser(user)}
                    >
                      <ClipboardCheck size={14} />
                      {PENDING_REQUESTS_PAGE.review}
                    </Button>
                  </div>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <UserRequestReviewPanel
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onResolved={handleResolved}
      />
    </>
  );
}
