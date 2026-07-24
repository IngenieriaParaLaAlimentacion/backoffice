"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  X,
} from "lucide-react";

const PAGE_SIZE = 20;

type Decision = "approve" | "reject";

export default function SolicitudesPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserAdminView | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

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

  const openReview = (user: UserAdminView) => {
    setSelectedUser(user);
    setDecisions({});
    setApplyError(null);
  };

  const closeReview = () => {
    setSelectedUser(null);
    setDecisions({});
    setApplyError(null);
  };

  const setDecision = (establishmentId: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [establishmentId]: decision }));
  };

  const allDecided = useMemo(() => {
    if (!selectedUser) return false;
    return selectedUser.establishments.every((est) => decisions[est.id]);
  }, [selectedUser, decisions]);

  const handleApply = async () => {
    if (!selectedUser || !allDecided) return;

    const approvedIds = selectedUser.establishments
      .filter((est) => decisions[est.id] === "approve")
      .map((est) => est.id);
    const rejectedIds = selectedUser.establishments
      .filter((est) => decisions[est.id] === "reject")
      .map((est) => est.id);

    setIsApplying(true);
    setApplyError(null);
    try {
      if (approvedIds.length > 0) {
        await approveEstablishmentsAction(
          selectedUser.id,
          approvedIds,
          makeAuthorizedRequest,
        );
      }
      if (rejectedIds.length > 0) {
        await rejectEstablishmentsAction(
          selectedUser.id,
          rejectedIds,
          makeAuthorizedRequest,
        );
      }
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      closeReview();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Error al aplicar los cambios");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-1 gap-4 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
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
                    <tr
                      key={user.id}
                      className={`bg-card hover:bg-muted/30 transition-colors ${
                        selectedUser?.id === user.id ? "bg-muted/40" : ""
                      }`}
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
                            variant={selectedUser?.id === user.id ? "default" : "outline"}
                            onClick={() => openReview(user)}
                          >
                            <ClipboardCheck size={14} />
                            Revisar
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

      {selectedUser && (
        <Card className="w-[28rem] shrink-0 p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight">
                {selectedUser.name} {selectedUser.last_name}
              </h2>
              <p className="text-muted-foreground text-sm">{selectedUser.email}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={closeReview}>
              <X size={16} />
            </Button>
          </div>

          <Separator />

          <p className="text-muted-foreground text-sm">
            Establecimientos a los que solicita acceso. Acepta o rechaza cada uno y
            presiona Aplicar.
          </p>

          {applyError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {applyError}
            </div>
          )}

          <div className="flex flex-col gap-3 overflow-y-auto">
            {selectedUser.establishments.map((est) => {
              const decision = decisions[est.id];
              return (
                <div
                  key={est.id}
                  className="rounded-lg border border-border p-3 flex flex-col gap-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{est.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {est.formatted_address}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={decision === "approve" ? "default" : "outline"}
                      className="flex-1"
                      disabled={isApplying}
                      onClick={() => setDecision(est.id, "approve")}
                    >
                      <Check size={14} />
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 ${
                        decision === "reject"
                          ? "bg-destructive/10 text-destructive border-destructive/50 hover:bg-destructive/20 hover:text-destructive"
                          : "text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                      }`}
                      disabled={isApplying}
                      onClick={() => setDecision(est.id, "reject")}
                    >
                      <X size={14} />
                      Rechazar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <Button
            disabled={!allDecided || isApplying}
            onClick={handleApply}
          >
            {isApplying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Aplicar
          </Button>
        </Card>
      )}
    </div>
  );
}
