"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";

export function FiltersToggle({
  open,
  onToggle,
  activeCount,
  hasActiveFilters,
  onClear,
}: {
  open: boolean;
  onToggle: () => void;
  activeCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={onToggle}
      >
        <SlidersHorizontal size={14} />
        Filtros
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {activeCount}
          </span>
        )}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Button>

      {hasActiveFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-muted-foreground"
          onClick={onClear}
        >
          <X size={14} />
          Borrar filtros
        </Button>
      )}
    </>
  );
}

export function FilterPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
      {children}
    </div>
  );
}
