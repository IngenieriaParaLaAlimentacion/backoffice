"use client";

import { use } from "react";
import EstablishmentSubjectsList from "./EstablishmentSubjectsList";
import { useEstablishmentDashboardContext } from "./layout";

export default function EstablishmentSubjectsTabPanel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dashboard = useEstablishmentDashboardContext();

  return (
    <EstablishmentSubjectsList
      establishmentId={id}
      establishmentName={dashboard?.establishment.name}
    />
  );
}
