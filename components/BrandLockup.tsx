import BrandMark from "@/components/BrandMark";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  /**
   * `dark` is for the sidebar's tierra-oscura surface: the mark keeps its own
   * dark-earth branches (they would vanish against it), so it sits on a paper
   * chip and only the wordmark inverts.
   */
  surface?: "paper" | "dark";
  /** Hides the wordmark, e.g. the collapsed sidebar. */
  markOnly?: boolean;
  /** `lg` is for standalone use (the auth screen), `default` for chrome. */
  size?: "default" | "lg";
  className?: string;
};

/** The mark plus the "Raíz" wordmark, in Fraunces. */
export default function BrandLockup({
  surface = "paper",
  markOnly = false,
  size = "default",
  className,
}: BrandLockupProps) {
  const isLarge = size === "lg";

  return (
    <span
      className={cn(
        "flex items-center",
        isLarge ? "gap-3" : "gap-2",
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md",
          isLarge ? "size-11" : "size-8",
          surface === "dark" && "bg-background",
        )}
      >
        <BrandMark
          title={markOnly ? BRAND.logoAlt : undefined}
          className={isLarge ? "size-10" : "size-6"}
        />
      </span>
      {!markOnly && (
        <span
          className={cn(
            "font-heading truncate leading-none font-semibold",
            isLarge ? "text-2xl" : "text-lg",
            surface === "dark" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
