"use client";

import { EstablishmentMetrics as Metrics } from "@/types/establishment";
import { ESTABLISHMENT_DASHBOARD_PAGE as COPY } from "@/constants/establishments";
import { formatAgeMonths, formatDateTime, formatMetric } from "@/lib/format";

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
    </div>
  );
}

/**
 * Branches on `has_data`, never on `subject_count === 0`. When there is no
 * data the averages come back as `null` and no tile is rendered at all —
 * showing "0 kg" / "IMC 0" for an unmeasured comedor is exactly the bug this
 * response shape exists to prevent.
 */
export default function EstablishmentMetrics({
  hasData,
  metrics,
}: {
  hasData: boolean;
  metrics: Metrics;
}) {
  if (!hasData) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-dashed border-border py-8 text-center">
        <span className="text-sm text-muted-foreground">{COPY.noData}</span>
        <span className="mx-auto max-w-md text-xs text-muted-foreground">
          {COPY.noDataHint}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricTile
          label={COPY.metrics.subjects}
          value={String(metrics.subject_count)}
        />
        <MetricTile
          label={COPY.metrics.height}
          value={formatMetric(metrics.avg_height_cm, "cm")}
        />
        <MetricTile
          label={COPY.metrics.weight}
          value={formatMetric(metrics.avg_weight_kg, "kg")}
        />
        <MetricTile
          label={COPY.metrics.bmi}
          value={formatMetric(metrics.avg_bmi)}
        />
        <MetricTile
          label={COPY.metrics.age}
          value={formatAgeMonths(metrics.avg_age_months)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {COPY.measurementsSummary(metrics.measurement_count)}
        {metrics.last_measured_at &&
          ` · ${COPY.lastMeasuredAt}: ${formatDateTime(metrics.last_measured_at)}`}
      </p>
    </div>
  );
}
