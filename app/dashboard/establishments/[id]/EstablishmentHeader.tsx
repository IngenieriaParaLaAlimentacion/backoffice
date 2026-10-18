"use client";

import { useRouter } from "next/navigation";
import {
  EstablishmentCharacterization,
  EstablishmentResponse,
} from "@/types/establishment";
import { Button } from "@/components/ui/button";
import { ESTABLISHMENT_DASHBOARD_PAGE as COPY } from "@/constants/establishments";
import { ArrowLeft } from "lucide-react";
import ProfilePendingBadge from "@/components/establishments/ProfilePendingBadge";
import { locationDetail, profileSummary } from "./profileDisplay";

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
  characterization,
  completeProfileHref,
}: {
  establishment: EstablishmentResponse;
  characterization: EstablishmentCharacterization;
  /** Where "Perfil pendiente" links to; omitted for read-only viewers. */
  completeProfileHref?: string;
}) {
  const router = useRouter();

  // router.back() restores the panel's filters (they live in the query string)
  // and its scroll position. On a deep link there is nothing to go back to.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push(PANEL_HREF);
  };

  const summary = profileSummary(characterization);
  const detail = locationDetail(characterization);

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
        <h1 className="text-3xl font-semibold">{establishment.name}</h1>
        {establishment.characterization_status === "pending" ? (
          <div className="mb-1">
            <ProfilePendingBadge href={completeProfileHref} />
          </div>
        ) : (
          summary && <p className="text-sm font-medium">{summary}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {establishment.formatted_address}
          {detail && ` · ${detail}`}
        </p>
      </div>
    </div>
  );
}
