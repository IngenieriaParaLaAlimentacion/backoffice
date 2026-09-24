"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import {
  EstablishmentFilters,
  exportEstablishmentsAction,
  listEstablishmentsAction,
} from "@/services/establishment.service";
import {
  EstablishmentResponse,
  EstablishmentSortOrder,
} from "@/types/establishment";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import ExportButton from "@/components/listings/ExportButton";
import ExportError from "@/components/listings/ExportError";
import { useCsvExport } from "@/hooks/useCsvExport";
import { EXPORT, EXPORT_FILENAMES } from "@/constants/exports";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  GROUP_HOVER_UNDERLINE,
  RowChevron,
  RowLink,
  ROW_HOVER_CLASS,
} from "@/components/listings/RowAffordance";
import { CircleCheck, Loader2, Plus, X } from "lucide-react";
import {
  ESTABLISHMENT_SORT_OPTIONS,
  ESTABLISHMENTS_LIST_PAGE,
  FILTER_DEBOUNCE_MS,
  PAGE_SIZE,
} from "@/constants/establishments";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { getErrorMessage } from "@/lib/errorMessages";
import { EstablishmentsView, ViewToggle } from "./ViewToggle";
import EstablishmentListFilters from "./EstablishmentListFilters";
import EstablishmentsMapView from "./map/EstablishmentsMapView";

const PROPOSED_BANNER_MS = 5000;

const DEFAULT_SORT_ORDER: EstablishmentSortOrder = "newest";

const SORT_VALUES = ESTABLISHMENT_SORT_OPTIONS.map((o) => o.value);

function parseSortOrder(value: string | null): EstablishmentSortOrder {
  return SORT_VALUES.includes(value as EstablishmentSortOrder)
    ? (value as EstablishmentSortOrder)
    : DEFAULT_SORT_ORDER;
}

function parseView(value: string | null): EstablishmentsView {
  return value === "map" ? "map" : "list";
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function EstablishmentsContent() {
  const { makeAuthorizedRequest, makeAuthorizedDownload } = useAuth();
  const { can } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live in the query string so that going back from an establishment
  // detail restores them (and the scroll position) for free.
  const search = searchParams.get("search") ?? "";
  const cityFilter = searchParams.get("city") ?? "";
  const provinceFilter = searchParams.get("province") ?? "";
  const sortOrder = parseSortOrder(searchParams.get("sort_order"));
  const page = parsePage(searchParams.get("page"));
  // Also in the URL, so going back from a ficha lands on the same view.
  const view = parseView(searchParams.get("view"));
  const isMapView = view === "map";

  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProposedBanner, setShowProposedBanner] = useState(
    () => searchParams.get("proposed") === "1",
  );

  // Local mirrors so typing stays responsive; the debounce writes to the URL.
  const [searchInput, setSearchInput] = useState(search);
  const [cityInput, setCityInput] = useState(cityFilter);
  const [provinceInput, setProvinceInput] = useState(provinceFilter);

  // City and province live behind the same collapsible the other listings use.
  // It starts open when the URL already carries one, so a filter restored by
  // back-navigation is never hidden behind a closed panel.
  const [filtersOpen, setFiltersOpen] = useState(
    () => Boolean(cityFilter) || Boolean(provinceFilter),
  );
  const activeFilterCount = [cityInput, provinceInput].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || searchInput !== "";

  const {
    isExporting,
    error: exportError,
    clearError: clearExportError,
    runExport,
  } = useCsvExport();

  const updateParams = useCallback(
    (
      next: Partial<{
        search: string;
        city: string;
        province: string;
        sort_order: string;
        page: number;
        view: EstablishmentsView;
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
      if (next.view !== undefined) {
        if (next.view === "map") params.set("view", "map");
        else params.delete("view");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  // Strip the flag right away so a refresh or back-navigation doesn't
  // resurrect the banner — its visibility from here on lives in
  // showProposedBanner (below), not in the URL.
  useEffect(() => {
    if (searchParams.get("proposed") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("proposed");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (!showProposedBanner) return;
    const timeout = setTimeout(
      () => setShowProposedBanner(false),
      PROPOSED_BANNER_MS,
    );
    return () => clearTimeout(timeout);
  }, [showProposedBanner]);

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

  const fetchEstablishments = useCallback(
    async (currentPage: number, currentFilters: EstablishmentFilters) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          ...currentFilters,
        });
        setEstablishments(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          getErrorMessage(err, {
            fallback: ESTABLISHMENTS_LIST_PAGE.loadError,
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  // The filters the listing is showing; the export sends the very same ones.
  const filters: EstablishmentFilters = useMemo(
    () => ({
      search: search || undefined,
      city: cityFilter || undefined,
      province: provinceFilter || undefined,
      sort_order: sortOrder,
    }),
    [search, cityFilter, provinceFilter, sortOrder],
  );

  // The map has its own (unpaginated) request; the table is only fetched while
  // it is the visible view, and again each time it comes back.
  useEffect(() => {
    if (isMapView) return;
    fetchEstablishments(page, filters);
  }, [fetchEstablishments, page, filters, isMapView]);

  const handleExport = () =>
    runExport(
      () => exportEstablishmentsAction(makeAuthorizedDownload, filters),
      EXPORT_FILENAMES.establishments,
    );

  // Write through to the URL rather than waiting on the debounce: clearing is
  // a click, and the effect above no-ops once the mirrors and the URL agree.
  const clearFilters = () => {
    setSearchInput("");
    setCityInput("");
    setProvinceInput("");
    updateParams({ search: "", city: "", province: "", page: 1 });
  };

  const detailHref = (id: string) => `/dashboard/establishments/${id}`;

  return (
    <>
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">
              {ESTABLISHMENTS_LIST_PAGE.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {ESTABLISHMENTS_LIST_PAGE.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <ViewToggle
              view={view}
              onChange={(next) => updateParams({ view: next })}
            />
            {/* The export follows the table's filters, which the map ignores. */}
            {!isMapView && (
              <ExportButton
                isExporting={isExporting}
                onClick={handleExport}
                disabled={isLoading || total === 0}
                emptyHint={total === 0 ? EXPORT.empty : undefined}
              />
            )}
            {can("establishments.create") ? (
              <Link
                href="/dashboard/establishments/create"
                className={buttonVariants({ size: "sm" })}
              >
                <Plus size={14} />
                {ESTABLISHMENTS_LIST_PAGE.createButton}
              </Link>
            ) : (
              // Roles without establishments.create (analyst today) can't
              // create outright, but can still propose one for an admin to
              // review — see PROPOSE_ESTABLISHMENT_PAGE.
              <Link
                href="/dashboard/establishments/propose"
                className={buttonVariants({ size: "sm" })}
              >
                <Plus size={14} />
                {ESTABLISHMENTS_LIST_PAGE.proposeButton}
              </Link>
            )}
          </div>
        </div>

        <Separator />

        {!isMapView && (
          <EstablishmentListFilters
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            sortOrder={sortOrder}
            onSortChange={(value) =>
              updateParams({ sort_order: value, page: 1 })
            }
            cityInput={cityInput}
            onCityChange={setCityInput}
            provinceInput={provinceInput}
            onProvinceChange={setProvinceInput}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((o) => !o)}
            activeFilterCount={activeFilterCount}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        )}

        {showProposedBanner && (
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.success}`}
          >
            <CircleCheck size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">
              {ESTABLISHMENTS_LIST_PAGE.proposeSuccess}
            </span>
            <button
              type="button"
              onClick={() => setShowProposedBanner(false)}
              className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              aria-label={ESTABLISHMENTS_LIST_PAGE.closeAria}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!isMapView && error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!isMapView && exportError && (
          <ExportError message={exportError} onDismiss={clearExportError} />
        )}

        {isMapView ? (
          <EstablishmentsMapView
            // Same destination as a row of the table.
            onPinClick={(id) => router.push(detailHref(id))}
            onSeeList={() => updateParams({ view: "list" })}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : establishments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {ESTABLISHMENTS_LIST_PAGE.noEstablishments}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENTS_LIST_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENTS_LIST_PAGE.columns.address}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENTS_LIST_PAGE.columns.city}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENTS_LIST_PAGE.columns.province}
                    </th>
                    <ChevronHeaderCell />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {establishments.map((est) => (
                    <tr
                      key={est.id}
                      onClick={() => router.push(detailHref(est.id))}
                      className={`${ROW_HOVER_CLASS} bg-card`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={detailHref(est.id)}
                          onClick={(e) => e.stopPropagation()}
                          className={GROUP_HOVER_UNDERLINE}
                        >
                          {est.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {est.formatted_address}
                      </td>
                      <td className="px-4 py-3">{est.city}</td>
                      <td className="px-4 py-3">{est.province}</td>
                      <ChevronCell />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {establishments.map((est) => (
                <Link
                  key={est.id}
                  href={detailHref(est.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} bg-card`}
                >
                  <span className="flex flex-col gap-1">
                    <RowLink>
                      <span className="text-sm font-medium">{est.name}</span>
                    </RowLink>
                    <span className="text-xs text-muted-foreground">
                      {est.formatted_address}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {est.city}, {est.province}
                    </span>
                  </span>
                  <RowChevron className="shrink-0" />
                </Link>
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
    </>
  );
}

export default function EstablishmentsPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      }
    >
      <EstablishmentsContent />
    </Suspense>
  );
}
