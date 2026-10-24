import { EMPTY_VALUE } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One `<dt>/<dd>` pair of a profile `<dl>`; empty values read as `EMPTY_VALUE`. */
export default function ProfileField({
  label,
  value,
  truncate = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  /** Keep the value on one line (the edit page's read-only email/role). */
  truncate?: boolean;
  className?: string;
}) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm",
          truncate ? "truncate" : "break-words whitespace-pre-line",
          isEmpty && "text-muted-foreground",
        )}
      >
        {isEmpty ? EMPTY_VALUE : value}
      </dd>
    </div>
  );
}
