"use client";

import { useAuth } from "@/context/AuthContext";
import { useEstablishmentStock } from "@/hooks/useEstablishmentStock";
import { useFoodCategories } from "@/hooks/useFoodCategories";
import { useCsvExport } from "@/hooks/useCsvExport";
import { exportEstablishmentStockAction } from "@/services/establishment.service";
import ExportButton from "@/components/listings/ExportButton";
import { Button } from "@/components/ui/button";
import ExportError from "@/components/listings/ExportError";
import { EXPORT, EXPORT_FILENAMES } from "@/constants/exports";
import { FoodStockSortOrder } from "@/types/establishment";
import Pagination from "@/components/Pagination";
import {
  ESTABLISHMENT_STOCK_PAGE as COPY,
  SELECT_CLASS,
  STOCK_SORT_OPTIONS,
  STOCK_UNIT_LABELS,
} from "@/constants/establishments";
import { formatQuantity, formatTimestampDate } from "@/lib/format";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EstablishmentStockList({
  establishmentId,
  establishmentName,
}: {
  establishmentId: string;
  /** Only feeds the fallback filename; the server normally names the file. */
  establishmentName?: string;
}) {
  const { makeAuthorizedDownload } = useAuth();
  const categories = useFoodCategories();
  const {
    stock,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    categoryId,
    setCategoryId,
    sortOrder,
    setSortOrder,
  } = useEstablishmentStock(establishmentId);

  const {
    isExporting,
    error: exportError,
    clearError: clearExportError,
    runExport,
  } = useCsvExport();

  const handleExport = () =>
    runExport(
      () =>
        exportEstablishmentStockAction(
          makeAuthorizedDownload,
          establishmentId,
          {
            category_id: categoryId || undefined,
            only_available: true,
            sort_order: sortOrder,
          },
        ),
      EXPORT_FILENAMES.establishmentStock(establishmentName),
    );

  // No filter active but still nothing back means the establishment has no
  // stock loaded at all — a different message than "your filters matched
  // nothing", per CA4.
  const hasActiveFilters = Boolean(categoryId);
  const emptyMessage = hasActiveFilters ? COPY.noResults : COPY.noStock;

  const columns = COPY.columns;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">
            {COPY.subtitle(total)}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <ExportButton
            isExporting={isExporting}
            onClick={handleExport}
            disabled={isLoading || total === 0}
            emptyHint={total === 0 ? EXPORT.empty : undefined}
          />
          <Button
            size="sm"
            // The render target is a next/link <a>, not a <button>; without
            // this Base UI keeps native button semantics it cannot deliver.
            nativeButton={false}
            render={
              <Link
                href={`/dashboard/establishments/${establishmentId}/stock/movements`}
              />
            }
          >
            <ArrowLeftRight size={14} />
            {COPY.viewHistory}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {COPY.categoryLabel}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${SELECT_CLASS} w-full sm:w-56`}
          >
            <option value="">{COPY.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {COPY.sortLabel}
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as FoodStockSortOrder)}
            className={`${SELECT_CLASS} w-full sm:w-56`}
          >
            {STOCK_SORT_OPTIONS.map((opt) => (
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

      {exportError && (
        <ExportError message={exportError} onDismiss={clearExportError} />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : stock.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">{columns.food}</th>
                  <th className="px-4 py-3 font-medium">{columns.category}</th>
                  <th className="px-4 py-3 font-medium">{columns.unit}</th>
                  <th className="px-4 py-3 font-medium">{columns.quantity}</th>
                  <th className="px-4 py-3 font-medium">{columns.updatedAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stock.map((item) => (
                  <tr key={item.food.id} className="bg-card">
                    <td className="px-4 py-3 font-medium">{item.food.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.category.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {STOCK_UNIT_LABELS[item.unit] ?? item.unit}
                    </td>
                    <td className="px-4 py-3">
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTimestampDate(item.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {stock.map((item) => (
              <div
                key={item.food.id}
                className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">{item.food.name}</span>
                  <span className="whitespace-nowrap text-sm font-medium">
                    {formatQuantity(item.quantity)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {STOCK_UNIT_LABELS[item.unit] ?? item.unit}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{item.category.name}</span>
                  <span>{formatTimestampDate(item.updated_at)}</span>
                </div>
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
    </div>
  );
}
