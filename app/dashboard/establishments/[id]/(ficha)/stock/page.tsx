"use client";

import { use } from "react";
import EstablishmentStockList from "./EstablishmentStockList";
import { useEstablishmentDashboardContext } from "../layout";

export default function EstablishmentStockTabPanel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dashboard = useEstablishmentDashboardContext();

  return (
    <EstablishmentStockList
      establishmentId={id}
      establishmentName={dashboard?.establishment.name}
    />
  );
}
