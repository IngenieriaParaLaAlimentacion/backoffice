"use client";

import { useRouter } from "next/navigation";
import { EstablishmentResponse } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { ESTABLISHMENT_DASHBOARD_PAGE as COPY } from "@/constants/establishments";
import { ArrowLeft } from "lucide-react";

const PANEL_HREF = "/dashboard/establishments";

/**
 * Always rendered, including in the empty state — the API guarantees
 * `establishment` is populated even when `has_data` is false.
 *
 * The establishment has no `responsable` column in the data model; the field
 * workers list below is the closest available context for "who runs this".
 */
export default function EstablishmentHeader({
  establishment,
}: {
  establishment: EstablishmentResponse;
}) {
  const router = useRouter();

  // router.back() restores the panel's filters (they live in the query string)
  // and its scroll position. On a deep link there is nothing to go back to.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push(PANEL_HREF);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="sm"
        variant="ghost"
        onClick={goBack}
        className="self-start -ml-2"
      >
        <ArrowLeft size={16} />
        {COPY.back}
      </Button>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {establishment.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          {establishment.formatted_address}
        </p>
        <p className="text-muted-foreground text-sm">
          {establishment.city}, {establishment.province}
        </p>
      </div>
    </div>
  );
}
