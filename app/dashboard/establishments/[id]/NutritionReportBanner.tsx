import { ReactNode } from "react";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

/**
 * A callout of the report screens: an error that has to be noticed (`danger`)
 * or a state worth stating (`warning`).
 */
export default function NutritionReportBanner({
  tone,
  className,
  children,
}: {
  tone: "danger" | "warning";
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        TONE_BANNER_CLASS[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
