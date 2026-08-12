"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";
import { EstablishmentRequestAdminView } from "@/types/admin";
import { formatDateTime, EMPTY_VALUE } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import { ClipboardCheck, Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

export default function EstablishmentRequestsPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [requests, setRequests] = useState<EstablishmentRequestAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentRequestsAction(
          makeAuthorizedRequest,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
          },
        );
        setRequests(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar comedores",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchRequests(page);
  }, [fetchRequests, page]);

  const openReview = (request: EstablishmentRequestAdminView) => {
    // TODO (Parte 3): abre el panel de revisión.
    console.log("Revisar", request.id);
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Comedores faltantes
          </h1>
          <p className="text-muted-foreground text-sm">
            Notificaciones de comedores pendientes de alta
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
        ) : requests.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            No hay comedores pendientes de alta
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Relevador</th>
                    <th className="px-4 py-3 font-medium">Ciudad/Provincia</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="bg-card hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {request.name ?? "Sin nombre"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>
                            {request.requester_name}{" "}
                            {request.requester_last_name}
                          </span>
                          <span className="text-xs">
                            {request.requester_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {request.city && request.province
                          ? `${request.city}, ${request.province}`
                          : EMPTY_VALUE}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(request.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReview(request)}
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
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {request.name ?? "Sin nombre"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {request.requester_name} {request.requester_last_name} ·{" "}
                      {request.requester_email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {request.city && request.province
                        ? `${request.city}, ${request.province}`
                        : EMPTY_VALUE}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(request.created_at)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReview(request)}
                  >
                    <ClipboardCheck size={14} />
                    Revisar
                  </Button>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
