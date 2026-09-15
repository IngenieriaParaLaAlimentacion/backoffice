"use client";

import { use } from "react";
import EstablishmentFieldWorkersList from "../EstablishmentFieldWorkersList";

export default function EstablishmentFieldWorkersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <EstablishmentFieldWorkersList establishmentId={id} />;
}
