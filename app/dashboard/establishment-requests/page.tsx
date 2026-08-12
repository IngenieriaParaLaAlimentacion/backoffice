"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import {
  approveEstablishmentRequestAction,
  listEstablishmentRequestsAction,
  rejectEstablishmentRequestAction,
} from "@/services/establishmentRequest.service";
import {
  EstablishmentApprovalResponse,
  EstablishmentRequestAdminView,
} from "@/types/admin";
import {
  createEstablishmentSchema,
  CreateEstablishmentInput,
} from "@/schemas/establishment.schema";
import { formatDateTime, EMPTY_VALUE } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import AppTextField from "@/components/AppTextField";
import { Check, CircleCheck, ClipboardCheck, Loader2, X } from "lucide-react";

const PAGE_SIZE = 20;

export default function EstablishmentRequestsPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [requests, setRequests] = useState<EstablishmentRequestAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<EstablishmentRequestAdminView | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  } = useForm<CreateEstablishmentInput>({
    resolver: zodResolver(createEstablishmentSchema),
    mode: "onChange",
    defaultValues: { name: "", formatted_address: "", city: "", province: "" },
  });

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
    setSelectedRequest(request);
    setPanelError(null);
    setSuccessMessage(null);
    reset({
      name: request.name,
      formatted_address: request.formatted_address,
      city: request.city ?? "",
      province: request.province ?? "",
    });
  };

  const closeReview = () => {
    setSelectedRequest(null);
    setPanelError(null);
    reset();
  };

  const removeFromList = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const onApprove = async (data: CreateEstablishmentInput) => {
    if (!selectedRequest) return;
    setPanelError(null);
    try {
      const result: EstablishmentApprovalResponse =
        await approveEstablishmentRequestAction(
          makeAuthorizedRequest,
          selectedRequest.id,
          data,
        );
      removeFromList(selectedRequest.id);
      setSuccessMessage(
        result.reused
          ? "Comedor dado de alta correctamente. Se reutilizó un comedor ya existente con esa ubicación."
          : "Comedor dado de alta correctamente.",
      );
      closeReview();
    } catch (err) {
      setPanelError(
        err instanceof Error ? err.message : "Error al aprobar la solicitud",
      );
    }
  };

  const onReject = async () => {
    if (!selectedRequest) return;
    setPanelError(null);
    setIsRejecting(true);
    try {
      await rejectEstablishmentRequestAction(
        makeAuthorizedRequest,
        selectedRequest.id,
      );
      removeFromList(selectedRequest.id);
      setSuccessMessage(null);
      closeReview();
    } catch (err) {
      setPanelError(
        err instanceof Error ? err.message : "Error al rechazar la solicitud",
      );
    } finally {
      setIsRejecting(false);
    }
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

        {successMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-600 text-sm">
            <CircleCheck size={18} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
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
                      className={`bg-card hover:bg-muted/30 transition-colors ${
                        selectedRequest?.id === request.id ? "bg-muted/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{request.name}</td>
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
                            variant={
                              selectedRequest?.id === request.id
                                ? "default"
                                : "outline"
                            }
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
                  className={`flex flex-col gap-2 rounded-lg border border-border bg-card p-3 ${
                    selectedRequest?.id === request.id ? "bg-muted/40" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{request.name}</span>
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
                    variant={
                      selectedRequest?.id === request.id ? "default" : "outline"
                    }
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

      <Dialog.Root
        open={!!selectedRequest}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeReview();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-xl font-bold tracking-tight">
                  {selectedRequest?.name}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground text-sm">
                  {selectedRequest?.requester_name}{" "}
                  {selectedRequest?.requester_last_name} ·{" "}
                  {selectedRequest?.requester_email}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={<button type="button" />}
                className="text-muted-foreground hover:text-foreground mt-0.5"
              >
                <X size={18} />
              </Dialog.Close>
            </div>

            <Separator />

            {panelError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
                {panelError}
              </div>
            )}

            {selectedRequest && (
              <form
                onSubmit={handleSubmit(onApprove)}
                className="flex flex-col gap-4"
              >
                <AppTextField
                  control={control}
                  name="name"
                  label="Nombre"
                  placeholder="Ej: Comedor Central Norte"
                  required
                />
                <AppTextField
                  control={control}
                  name="formatted_address"
                  label="Dirección"
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  required
                />
                <AppTextField
                  control={control}
                  name="city"
                  label="Ciudad"
                  placeholder="Ej: Buenos Aires"
                  required
                />
                <AppTextField
                  control={control}
                  name="province"
                  label="Provincia"
                  placeholder="Ej: CABA"
                  required
                />

                <Separator />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!isValid || isSubmitting || isRejecting}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Aprobar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    disabled={isSubmitting || isRejecting}
                    onClick={onReject}
                  >
                    {isRejecting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    Rechazar
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
