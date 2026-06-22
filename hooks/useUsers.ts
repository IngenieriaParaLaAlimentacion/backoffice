import { useAuth } from "@/context/AuthContext";
import { listUsersAction } from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";

export function useUsers(role: string, pageSize: number) {
  const { makeAuthorizedRequest } = useAuth();
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        setUsers(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar usuarios",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, pageSize, role],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  return { users, page, totalPages, isLoading, error, setPage };
}
