"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  approveEstablishmentsAction,
  listUsersAction,
  rejectEstablishmentsAction,
} from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

const PAGE_SIZE = 20;

export default function SolicitudesPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listUsersAction(makeAuthorizedRequest, {
          status: "pending_validation",
          page: currentPage,
          page_size: PAGE_SIZE,
          role: "admin"
        });
        setUsers(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar solicitudes");
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const handleApprove = async (user: UserAdminView) => {
    setPendingAction(user.id);
    try {
      await approveEstablishmentsAction(
        user.id,
        user.establishments.map((e) => e.id),
        makeAuthorizedRequest,
      );
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (user: UserAdminView) => {
    setPendingAction(user.id);
    try {
      await rejectEstablishmentsAction(
        user.id,
        user.establishments.map((e) => e.id),
        makeAuthorizedRequest,
      );
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al rechazar");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
          <p className="text-muted-foreground text-sm">
            Usuarios técnicos pendientes de validación
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
            No hay solicitudes pendientes
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Establecimientos</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="bg-card hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {user.name} {user.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {user.establishments.map((est) => (
                            <span key={est.id} className="text-xs">
                              <span className="font-medium">{est.name}</span>
                              <span className="text-muted-foreground"> — {est.address}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                            disabled={pendingAction === user.id}
                            onClick={() => handleReject(user)}
                          >
                            {pendingAction === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            disabled={pendingAction === user.id}
                            onClick={() => handleApprove(user)}
                          >
                            {pendingAction === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Aprobar
                          </Button>
                        </div>
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
                <span>
                  Página {page} de {totalPages}
                </span>
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
    </div>
  );
}
