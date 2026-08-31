"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentRequestsAction } from "@/services/establishmentRequest.service";
import {
  EstablishmentApprovalResponse,
  EstablishmentRequestAdminView,
  EstablishmentRequestSortOrder,
} from "@/types/admin";
import { formatDateTime, EMPTY_VALUE } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import {
  CARD_HOVER_CLASS,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import EstablishmentRequestReviewPanel from "./EstablishmentRequestReviewPanel";
import { useRefreshPendingRequestsCount } from "../layout";
import { CircleCheck, ClipboardCheck, Loader2, Search, X } from "lucide-react";
import {
  ESTABLISHMENT_FORM_FIELDS,
  ESTABLISHMENT_REQUEST_SORT_OPTIONS,
  ESTABLISHMENT_REQUESTS_PAGE,
} from "@/constants/establishments";
import { TONE_BANNER_CLASS } from "@/constants/theme";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Matches the backend default (EstablishmentCreationRequestSortOrder.OLDEST):
// oldest-first surfaces the requests waiting the longest for review.
const DEFAULT_SORT_ORDER: EstablishmentRequestSortOrder = "oldest";

const SORT_OPTIONS = ESTABLISHMENT_REQUEST_SORT_OPTIONS;

function parseSortOrder(value: string | null): EstablishmentRequestSortOrder {
  return value === "newest" || value === "oldest" ? value : DEFAULT_SORT_ORDER;
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function EstablishmentRequestsContent() {
  const { makeAuthorizedRequest } = useAuth();
  const refreshPendingCount = useRefreshPendingRequestsCount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live in the query string so they survive a refresh or a back
  // navigation from the review panel, same pattern as Establecimientos.
  const search = searchParams.get("search") ?? "";
  const cityFilter = searchParams.get("city") ?? "";
  const provinceFilter = searchParams.get("province") ?? "";
  const sortOrder = parseSortOrder(searchParams.get("sort_order"));
  const page = parsePage(searchParams.get("page"));

  const [requests, setRequests] = useState<EstablishmentRequestAdminView[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local mirrors so typing stays responsive; the debounce writes to the URL.
  const [searchInput, setSearchInput] = useState(search);
  const [cityInput, setCityInput] = useState(cityFilter);
  const [provinceInput, setProvinceInput] = useState(provinceFilter);

  const [selectedRequest, setSelectedRequest] =
    useState<EstablishmentRequestAdminView | null>(null);

  const updateParams = useCallback(
    (
      next: Partial<{
        search: string;
        city: string;
        province: string;
        sort_order: string;
        page: number;
      }>,
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.search !== undefined) {
        if (next.search) params.set("search", next.search);
        else params.delete("search");
      }
      if (next.city !== undefined) {
        if (next.city) params.set("city", next.city);
        else params.delete("city");
      }
      if (next.province !== undefined) {
        if (next.province) params.set("province", next.province);
        else params.delete("province");
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
    if (
      searchInput === search &&
      cityInput === cityFilter &&
      provinceInput === provinceFilter
    )
      return;
    const timeout = setTimeout(() => {
      updateParams({
        search: searchInput,
        city: cityInput,
        province: provinceInput,
        page: 1,
      });
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [
    searchInput,
    search,
    cityInput,
    cityFilter,
    provinceInput,
    provinceFilter,
    updateParams,
  ]);

  const fetchRequests = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentCity: string,
      currentProvince: string,
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
            city: currentCity || undefined,
            province: currentProvince || undefined,
            sort_order: currentSortOrder,
          },
        );
        setRequests(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : ESTABLISHMENT_REQUESTS_PAGE.loadError,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchRequests(page, search, cityFilter, provinceFilter, sortOrder);
  }, [fetchRequests, page, search, cityFilter, provinceFilter, sortOrder]);

  const removeFromList = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleApproved = (result: EstablishmentApprovalResponse) => {
    if (!selectedRequest) return;
    removeFromList(selectedRequest.id);
    refreshPendingCount();
    setSuccessMessage(
      result.reused
        ? ESTABLISHMENT_REQUESTS_PAGE.successReused
        : ESTABLISHMENT_REQUESTS_PAGE.successCreated,
    );
    setSelectedRequest(null);
  };

  const handleRejected = () => {
    if (!selectedRequest) return;
    removeFromList(selectedRequest.id);
    refreshPendingCount();
    setSuccessMessage(null);
    setSelectedRequest(null);
  };

  const handleStale = () => {
    if (!selectedRequest) return;
    removeFromList(selectedRequest.id);
    refreshPendingCount();
    setSuccessMessage(ESTABLISHMENT_REQUESTS_PAGE.staleMessage);
    setSelectedRequest(null);
  };

  const openReview = (request: EstablishmentRequestAdminView) => {
    setSelectedRequest(request);
    setSuccessMessage(null);
  };

  return (
    <>
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">
            {ESTABLISHMENT_REQUESTS_PAGE.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ESTABLISHMENT_REQUESTS_PAGE.subtitle}
          </p>
        </div>

        <Separator />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {ESTABLISHMENT_REQUESTS_PAGE.searchLabel}
            </label>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={16}
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={ESTABLISHMENT_REQUESTS_PAGE.searchPlaceholder}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {ESTABLISHMENT_FORM_FIELDS.city.label}
            </label>
            <Input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={ESTABLISHMENT_FORM_FIELDS.city.placeholder}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {ESTABLISHMENT_FORM_FIELDS.province.label}
            </label>
            <Input
              value={provinceInput}
              onChange={(e) => setProvinceInput(e.target.value)}
              placeholder={ESTABLISHMENT_FORM_FIELDS.province.placeholder}
              className="w-full sm:w-40"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {ESTABLISHMENT_REQUESTS_PAGE.sortLabel}
            </label>
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
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.success}`}
          >
            <CircleCheck size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              aria-label={ESTABLISHMENT_REQUESTS_PAGE.closeAria}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            {ESTABLISHMENT_REQUESTS_PAGE.noRequests}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENT_REQUESTS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENT_REQUESTS_PAGE.columns.requester}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENT_REQUESTS_PAGE.columns.location}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENT_REQUESTS_PAGE.columns.requestedAt}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {ESTABLISHMENT_REQUESTS_PAGE.columns.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((request) => {
                    const isSelected = selectedRequest?.id === request.id;
                    return (
                      <tr
                        key={request.id}
                        onClick={() => openReview(request)}
                        className={`${ROW_HOVER_CLASS} ${rowStateClass(isSelected)}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {request.name}
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
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => openReview(request)}
                            >
                              <ClipboardCheck size={14} />
                              {ESTABLISHMENT_REQUESTS_PAGE.reviewButton}
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
              {requests.map((request) => {
                const isSelected = selectedRequest?.id === request.id;
                return (
                  <div
                    key={request.id}
                    onClick={() => openReview(request)}
                    className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} ${rowStateClass(isSelected)}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {request.name}
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
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => openReview(request)}
                    >
                      <ClipboardCheck size={14} />
                      {ESTABLISHMENT_REQUESTS_PAGE.reviewButton}
                    </Button>
                  </div>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(next) => updateParams({ page: next })}
            />
          </>
        )}
      </Card>

      <EstablishmentRequestReviewPanel
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApproved={handleApproved}
        onRejected={handleRejected}
        onStale={handleStale}
      />
    </>
  );
}

export default function EstablishmentRequestsPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      }
    >
      <EstablishmentRequestsContent />
    </Suspense>
  );
}
