"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FilterPanel,
  FiltersToggle,
} from "@/components/listings/FiltersToggle";
import {
  ESTABLISHMENT_SORT_OPTIONS,
  ESTABLISHMENTS_LIST_PAGE,
} from "@/constants/establishments";
import { EstablishmentSortOrder } from "@/types/establishment";

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  sortOrder: EstablishmentSortOrder;
  onSortChange: (value: string) => void;
  cityInput: string;
  onCityChange: (value: string) => void;
  provinceInput: string;
  onProvinceChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
};

/** Search, sort and the collapsible city/province filters of the table view. */
export default function EstablishmentListFilters({
  searchInput,
  onSearchChange,
  sortOrder,
  onSortChange,
  cityInput,
  onCityChange,
  provinceInput,
  onProvinceChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  hasActiveFilters,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {ESTABLISHMENTS_LIST_PAGE.searchLabel}
          </label>
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
            />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={ESTABLISHMENTS_LIST_PAGE.searchPlaceholder}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {ESTABLISHMENTS_LIST_PAGE.sortLabel}
          </label>
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
            className={`${SELECT_CLASS} w-full sm:w-56`}
          >
            {ESTABLISHMENT_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <FiltersToggle
          open={filtersOpen}
          onToggle={onToggleFilters}
          activeCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onClear={onClear}
        />
      </div>

      <FilterPanel open={filtersOpen}>
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {ESTABLISHMENTS_LIST_PAGE.filters.city}
          </label>
          <Input
            value={cityInput}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={ESTABLISHMENTS_LIST_PAGE.filters.city}
            className="w-full sm:w-40"
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {ESTABLISHMENTS_LIST_PAGE.filters.province}
          </label>
          <Input
            value={provinceInput}
            onChange={(e) => onProvinceChange(e.target.value)}
            placeholder={ESTABLISHMENTS_LIST_PAGE.filters.province}
            className="w-full sm:w-40"
          />
        </div>
      </FilterPanel>
    </div>
  );
}
