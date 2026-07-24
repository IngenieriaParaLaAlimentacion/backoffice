"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { listEstablishmentsAction } from "@/services/establishment.service";
import { EstablishmentResponse, EstablishmentSortOrder } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

export default function EstablecimientosPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<EstablishmentSortOrder>("newest");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

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
          err instanceof Error ? err.message : "Error al cargar establecimientos",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchEstablishments(page, debouncedSearch, sortOrder);
  }, [fetchEstablishments, page, debouncedSearch, sortOrder]);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Establecimientos</h1>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o dirección"
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">Ordenar por</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as EstablishmentSortOrder);
                setPage(1);
              }}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {establishments.map((est) => (
                    <tr
                      key={est.id}
                      className="bg-card transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium">{est.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {est.formatted_address}
                      </td>
                      <td className="px-4 py-3">{est.city}</td>
                      <td className="px-4 py-3">{est.province}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {establishments.map((est) => (
                <div
                  key={est.id}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
                >
                  <span className="text-sm font-medium">{est.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {est.formatted_address}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {est.city}, {est.province}
                  </span>
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
    </div>
  );
}
