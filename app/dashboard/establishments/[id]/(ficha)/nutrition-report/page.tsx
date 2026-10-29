"use client";

import { use } from "react";
import RequirePermission from "@/components/RequirePermission";
import NutritionReportPanel from "./NutritionReportPanel";

export default function EstablishmentNutritionReportTabPanel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RequirePermission permission="nutrition_reports.view">
      <NutritionReportPanel establishmentId={id} />
    </RequirePermission>
  );
}
