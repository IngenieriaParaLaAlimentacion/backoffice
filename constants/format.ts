export const RELATIVE_MEASUREMENT_TIME = {
  today: "hoy",
  days: (count: number) => `hace ${count} ${count === 1 ? "día" : "días"}`,
  months: (count: number) => `hace ${count} ${count === 1 ? "mes" : "meses"}`,
  years: (count: number) => `hace ${count} ${count === 1 ? "año" : "años"}`,
} as const;
