"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EvolutionPoint } from "@/types/measurement";
import { formatTimestampShortDate } from "@/lib/format";

/**
 * Recharts wants concrete SVG paint values, so the series read the chart
 * tokens through `var()` rather than through a Tailwind class. Peso/Talla take
 * the two greens and IMC the mustard, which is also why IMC stays dashed: it
 * is the one series whose hue is shared with the primary action.
 */
const SERIES_STROKE = {
  weight: "var(--chart-2)",
  height: "var(--chart-1)",
  bmi: "var(--chart-3)",
} as const;

type ChartDatum = {
  date: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
};

export default function MeasurementEvolutionChart({
  points,
}: {
  points: EvolutionPoint[];
}) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        Sin mediciones registradas
      </div>
    );
  }

  const data: ChartDatum[] = points.map((p) => ({
    date: formatTimestampShortDate(p.measured_at),
    weight_kg: p.weight_kg,
    height_cm: p.height_cm,
    bmi: p.bmi,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          fontSize={11}
          tickMargin={8}
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <YAxis
          yAxisId="weight"
          fontSize={11}
          width={40}
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <YAxis
          yAxisId="height"
          orientation="right"
          fontSize={11}
          width={40}
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--popover-foreground)",
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Legend />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="weight_kg"
          name="Peso (kg)"
          stroke={SERIES_STROKE.weight}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="height"
          type="monotone"
          dataKey="height_cm"
          name="Talla (cm)"
          stroke={SERIES_STROKE.height}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="bmi"
          name="IMC"
          stroke={SERIES_STROKE.bmi}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
