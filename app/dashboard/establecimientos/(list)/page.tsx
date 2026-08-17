"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { EstablishmentResponse, EstablishmentSortOrder } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  GROUP_HOVER_UNDERLINE,
  RowChevron,
  RowLink,
  ROW_HOVER_CLASS,
} from "@/components/listings/RowAffordance";
import { Loader2, Plus, Search } from "lucide-react";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DEFAULT_SORT_ORDER: EstablishmentSortOrder = "newest";

const SORT_OPTIONS: { value: EstablishmentSortOrder; label: string }[] = [
  { value: "newest", label: "Más recientes primero" },
  { value: "oldest", label: "Más antiguos primero" },
  { value: "name_asc", label: "Nombre A → Z" },
  { value: "name_desc", label: "Nombre Z → A" },
  { value: "city_asc", label: "Ciudad A → Z" },
  { value: "city_desc", label: "Ciudad Z → A" },
  { value: "province_asc", label: "Provincia A → Z" },
  { value: "province_desc", label: "Provincia Z → A" },
];

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

function parseSortOrder(value: string | null): EstablishmentSortOrder {
  return SORT_VALUES.includes(value as EstablishmentSortOrder)
    ? (value as EstablishmentSortOrder)
    : DEFAULT_SORT_ORDER;
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function EstablishmentsContent() {
  const { makeAuthorizedRequest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live in the query string so that going back from an establishment
  // detail restores them (and the scroll position) for free.
  const search = searchParams.get("search") ?? "";
  const sortOrder = parseSortOrder(searchParams.get("sort_order"));
  const page = parsePage(searchParams.get("page"));

  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>(
    [],
  );
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local mirror so typing stays responsive; the debounce writes to the URL.
  const [searchInput, setSearchInput] = useState(search);

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

  const fetchEstablishments = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentSortOrder: EstablishmentSortOrder,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEstablishmentsAction(makeAuthorizedRequest, {
          page: currentPage,
          page_size: PAGE_SIZE,
          search: currentSearch || undefined,
          sort_order: currentSortOrder,
        });
        setEstablishments(data.items);
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
    fetchEstablishments(page, search, sortOrder);
  }, [fetchEstablishments, page, search, sortOrder]);

  const detailHref = (id: string) => `/dashboard/establecimientos/${id}`;

  return (
    <>
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Establecimientos
            </h1>
            <p className="text-muted-foreground text-sm">
              Establecimientos registrados en el sistema
            </p>
          </div>
          <Link
            href="/dashboard/establecimientos/crear"
            className={buttonVariants({ size: "sm", className: "self-start" })}
          >
            <Plus size={14} />
            Nuevo establecimiento
          </Link>
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
                placeholder="Nombre o dirección"
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

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : establishments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No hay establecimientos
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Dirección</th>
                    <th className="px-4 py-3 font-medium">Ciudad</th>
                    <th className="px-4 py-3 font-medium">Provincia</th>
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
