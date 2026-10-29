"use client";

import { use } from "react";
import RequirePermission from "@/components/RequirePermission";
import NutritionReportDetail from "./NutritionReportDetail";

/**
 * A screen of its own rather than a nested tab: one report is read at length
 * (tables, sections), and the ficha's header and metrics would only push it
 * down. It lives outside `(ficha)` like the stock movements history.
 */
export default function EstablishmentNutritionReportPage({
  params,
}: {
  params: Promise<{ id: string; month: string }>;
}) {
  const { id, month } = use(params);

  return (
    <RequirePermission permission="nutritionReports.view">
      <NutritionReportDetail establishmentId={id} month={month} />
    </RequirePermission>
  );
}
