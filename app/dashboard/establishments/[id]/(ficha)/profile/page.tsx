"use client";

import { use } from "react";
import EstablishmentProfilePanel from "./EstablishmentProfilePanel";
import {
  useApplyCharacterization,
  useEstablishmentDashboardContext,
} from "../layout";

export default function EstablishmentProfileTabPanel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dashboard = useEstablishmentDashboardContext();
  const applyCharacterization = useApplyCharacterization();

  // The layout only renders tabs once the dashboard has loaded.
  if (!dashboard) return null;

  return (
    <EstablishmentProfilePanel
      establishmentId={id}
      characterization={dashboard.characterization}
      status={dashboard.establishment.characterization_status}
      onSaved={applyCharacterization}
    />
  );
}
