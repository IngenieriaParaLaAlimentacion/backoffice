"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  approveFieldWorkerAction,
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

export default function RequestsPage() {
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
        setError(
          err instanceof Error ? err.message : "Error al cargar solicitudes",
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

  /** Clicking the active decision again clears it, leaving the request pending. */
  const setDecision = (establishmentId: string, decision: Decision) => {
    setDecisions((prev) => {
      if (prev[establishmentId] === decision) {
        const next = { ...prev };
        delete next[establishmentId];
        return next;
      }
      return { ...prev, [establishmentId]: decision };
    });
  };

  const hasEstablishments = !!selectedUser?.establishments.length;

  const pendingCount = useMemo(() => {
    if (!selectedUser) return 0;
    return selectedUser.establishments.filter((est) => !decisions[est.id])
      .length;
  }, [selectedUser, decisions]);

  const handleApply = async () => {
    if (!selectedUser) return;

    const approvedIds = selectedUser.establishments
      .filter((est) => decisions[est.id] === "approve")
      .map((est) => est.id);
    const rejectedIds = selectedUser.establishments
      .filter((est) => decisions[est.id] === "reject")
      .map((est) => est.id);

    setIsApplying(true);
    setApplyError(null);
    try {
      // Activates the account; undecided establishments stay pending.
      await approveFieldWorkerAction(
        selectedUser.id,
        approvedIds,
        makeAuthorizedRequest,
      );
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
      setApplyError(
        err instanceof Error ? err.message : "Error al aplicar los cambios",
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-1 p-4">
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
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Establecimientos</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
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
                            variant={
                              selectedUser?.id === user.id
                                ? "default"
                                : "outline"
                            }
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

            <div className="flex flex-col gap-2 md:hidden">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex flex-col gap-2 rounded-lg border border-border bg-card p-3 ${
                    selectedUser?.id === user.id ? "bg-muted/40" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {user.name} {user.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.establishments.length} establecimiento
                      {user.establishments.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={
                      selectedUser?.id === user.id ? "default" : "outline"
                    }
                    onClick={() => openReview(user)}
                  >
                    <ClipboardCheck size={14} />
                    Revisar
                  </Button>
                </div>
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

      <Dialog.Root
        open={!!selectedUser}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeReview();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <Dialog.Title className="text-xl font-bold tracking-tight break-words">
                  {selectedUser
                    ? `${selectedUser.name} ${selectedUser.last_name}`
                    : "Solicitud"}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground text-sm break-all">
                  {selectedUser?.email}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={<button type="button" />}
                className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
              >
                <X size={18} />
              </Dialog.Close>
            </div>

            <Separator />

            <p className="text-muted-foreground text-sm">
              {hasEstablishments
                ? "Aceptá o rechazá los establecimientos que quieras resolver ahora; los que dejes sin decidir quedan pendientes."
                : "No solicitó acceso a ningún establecimiento."}
            </p>

            {applyError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
                {applyError}
              </div>
            )}

            {selectedUser && (
              <>
                {hasEstablishments && (
                  <>
                    <div className="flex flex-col gap-3">
                      {selectedUser.establishments.map((est) => {
                        const decision = decisions[est.id];
                        return (
                          <div
                            key={est.id}
                            className="rounded-lg border border-border p-3 flex flex-col gap-2"
                          >
                            <div className="flex min-w-0 flex-col">
                              <span className="font-medium text-sm break-words">
                                {est.name}
                              </span>
                              <span className="text-muted-foreground text-xs break-words">
                                {est.formatted_address}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={
                                  decision === "approve" ? "default" : "outline"
                                }
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

                    {pendingCount > 0 && (
                      <p className="text-muted-foreground text-xs">
                        {pendingCount} establecimiento
                        {pendingCount === 1 ? "" : "s"} quedará
                        {pendingCount === 1 ? "" : "n"} pendiente
                        {pendingCount === 1 ? "" : "s"}.
                      </p>
                    )}
                  </>
                )}

                <Button disabled={isApplying} onClick={handleApply}>
                  {isApplying ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Aceptar solicitud
                </Button>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
