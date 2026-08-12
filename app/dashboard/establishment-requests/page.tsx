"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  EstablishmentRequestSortOrder,
} from "@/types/admin";
import {
  createEstablishmentSchema,
  CreateEstablishmentInput,
} from "@/schemas/establishment.schema";
import { formatDateTime, EMPTY_VALUE } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import AppTextField from "@/components/AppTextField";
import {
  Check,
  CircleCheck,
  ClipboardCheck,
  Loader2,
  Search,
  X,
} from "lucide-react";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Matches the backend default (EstablishmentCreationRequestSortOrder.OLDEST):
// oldest-first surfaces the requests waiting the longest for review.
const DEFAULT_SORT_ORDER: EstablishmentRequestSortOrder = "oldest";

const SORT_OPTIONS: { value: EstablishmentRequestSortOrder; label: string }[] =
  [
    { value: "oldest", label: "Más antiguos primero" },
    { value: "newest", label: "Más recientes primero" },
  ];

function parseSortOrder(value: string | null): EstablishmentRequestSortOrder {
  return value === "newest" || value === "oldest" ? value : DEFAULT_SORT_ORDER;
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function EstablishmentRequestsContent() {
  const { makeAuthorizedRequest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live in the query string so they survive a refresh or a back
  // navigation from the review panel, same pattern as Establecimientos.
  const search = searchParams.get("search") ?? "";
  const sortOrder = parseSortOrder(searchParams.get("sort_order"));
  const page = parsePage(searchParams.get("page"));

  const [requests, setRequests] = useState<EstablishmentRequestAdminView[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local mirror so typing stays responsive; the debounce writes to the URL.
  const [searchInput, setSearchInput] = useState(search);

  const [selectedRequest, setSelectedRequest] =
    useState<EstablishmentRequestAdminView | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // First click arms the action (shows its confirmation UI); a second click
  // on the same button actually submits it. Clicking the other button while
  // one is armed re-arms that one instead, so switching also needs its own
  // confirmation.
  const [pendingAction, setPendingAction] = useState<
    "approve" | "reject" | null
  >(null);

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

  const updateParams = useCallback(
    (next: Partial<{ search: string; sort_order: string; page: number }>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.search !== undefined) {
        if (next.search) params.set("search", next.search);
        else params.delete("search");
      }
      if (next.sort_order !== undefined) {
        if (next.sort_order && next.sort_order !== DEFAULT_SORT_ORDER)
          params.set("sort_order", next.sort_order);
        else params.delete("sort_order");
      }
      if (next.page !== undefined) {
        if (next.page > 1) params.set("page", String(next.page));
        else params.delete("page");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (searchInput === search) return;
    const timeout = setTimeout(() => {
      updateParams({ search: searchInput, page: 1 });
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput, search, updateParams]);

  const fetchRequests = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentSortOrder: EstablishmentRequestSortOrder,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentRequestsAction(
          makeAuthorizedRequest,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
            search: currentSearch || undefined,
            sort_order: currentSortOrder,
          },
        );
        setRequests(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar establecimientos",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchRequests(page, search, sortOrder);
  }, [fetchRequests, page, search, sortOrder]);

  const openReview = (request: EstablishmentRequestAdminView) => {
    setSelectedRequest(request);
    setPanelError(null);
    setSuccessMessage(null);
    setRejectReason("");
    setPendingAction(null);
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
    setRejectReason("");
    setPendingAction(null);
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
          ? "Establecimiento dado de alta correctamente. Se reutilizó un establecimiento ya existente con esa ubicación."
          : "Establecimiento dado de alta correctamente.",
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
        rejectReason.trim() || undefined,
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

  const handleApproveClick = () => {
    if (pendingAction !== "approve") {
      setPendingAction("approve");
      return;
    }
    handleSubmit(onApprove)();
  };

  const handleRejectClick = () => {
    if (pendingAction !== "reject") {
      setPendingAction("reject");
      return;
    }
    onReject();
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Establecimientos faltantes
          </h1>
          <p className="text-muted-foreground text-sm">
            Notificaciones de establecimientos pendientes de alta
          </p>
        </div>

        <Separator />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Buscar</label>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={16}
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nombre, dirección o relevador"
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Ordenar por</label>
            <select
              value={sortOrder}
              onChange={(e) =>
                updateParams({ sort_order: e.target.value, page: 1 })
              }
              className={`${SELECT_CLASS} w-full sm:w-56`}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
            No hay establecimientos pendientes de alta
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
              onPageChange={(next) => updateParams({ page: next })}
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
              <div className="flex flex-col gap-4">
                <AppTextField
                  control={control}
                  name="name"
                  label="Nombre"
                  placeholder="Ej: Establecimiento Central Norte"
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

                {pendingAction === "reject" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">
                      Motivo del rechazo
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        (opcional)
                      </span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ej: Datos incompletos, comedor duplicado..."
                      rows={2}
                      maxLength={500}
                      autoFocus
                      disabled={isSubmitting || isRejecting}
                      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Confirmá el rechazo para aplicarlo.
                    </p>
                  </div>
                )}

                {pendingAction === "approve" && (
                  <p className="text-sm text-muted-foreground">
                    Confirmá el alta para crear el establecimiento con estos
                    datos.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={!isValid || isSubmitting || isRejecting}
                    onClick={handleApproveClick}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {pendingAction === "approve" ? "Confirmar alta" : "Aprobar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    disabled={isSubmitting || isRejecting}
                    onClick={handleRejectClick}
                  >
                    {isRejecting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    {pendingAction === "reject"
                      ? "Confirmar rechazo"
                      : "Rechazar"}
                  </Button>
                </div>

                {pendingAction && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmitting || isRejecting}
                    onClick={() => setPendingAction(null)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default function EstablishmentRequestsPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      }
    >
      <EstablishmentRequestsContent />
    </Suspense>
  );
}
