"use client";

import { ESTABLISHMENT_STOCK_PAGE as COPY } from "@/constants/establishments";

export default function EstablishmentStockPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground text-sm">
      {COPY.empty}
    </div>
  );
}
