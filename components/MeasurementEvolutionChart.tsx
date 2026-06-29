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

type ChartDatum = {
  date: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
};

// "2026-03-01T10:00:00Z" -> "01/03/26"
function formatTick(measuredAt: string) {
  const d = new Date(measuredAt);
  if (Number.isNaN(d.getTime())) return measuredAt;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

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
    date: formatTick(p.measured_at),
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
        <XAxis dataKey="date" fontSize={11} tickMargin={8} />
        <YAxis yAxisId="weight" fontSize={11} width={40} />
        <YAxis
          yAxisId="height"
          orientation="right"
          fontSize={11}
          width={40}
        />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="weight_kg"
          name="Peso (kg)"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="height"
          type="monotone"
          dataKey="height_cm"
          name="Talla (cm)"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="bmi"
          name="IMC"
          stroke="#d97706"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
