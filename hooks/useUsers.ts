import { useAuth } from "@/context/AuthContext";
import { listUsersAction } from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessages";
import { USERS_PAGE } from "@/constants/users";

export function useUsers(role: string, pageSize: number) {
  const { makeAuthorizedRequest } = useAuth();
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listUsersAction(makeAuthorizedRequest, {
          status: "active",
          role,
          page: currentPage,
          page_size: pageSize,
        });
        // The page can fall past the end when its last user leaves the list
        // (e.g. a role change); jump to the new last page instead of showing
        // an empty one with the pagination controls hidden.
        const lastPage = Math.max(1, data.total_pages);
        if (currentPage > lastPage) {
          setPage(lastPage);
          return;
        }
        setUsers(data.items);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      } catch (err) {
        setError(getErrorMessage(err, { fallback: USERS_PAGE.loadError }));
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, pageSize, role],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  /** Re-fetches the current page, e.g. after a user moved to another role. */
  const refetch = useCallback(() => {
    void fetchUsers(page);
  }, [fetchUsers, page]);

  return { users, page, totalPages, total, isLoading, error, setPage, refetch };
}
