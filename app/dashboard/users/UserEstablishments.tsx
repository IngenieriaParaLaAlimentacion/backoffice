import { EstablishmentResponse } from "@/types/establishment";
import { MAX_LISTED_ESTABLISHMENTS, USERS_PAGE } from "@/constants/users";
import { cn } from "@/lib/utils";

/**
 * A user's establishments for a table cell or card. A field worker can hold
 * dozens, which would stretch their row across the screen, so only the first
 * few are listed and the rest are counted; the full list lives in the detail
 * panel. Renders the empty marker when there are none.
 */
export default function UserEstablishments({
  establishments,
  className,
}: {
  establishments: readonly EstablishmentResponse[];
  className?: string;
}) {
  if (establishments.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const listed = establishments.slice(0, MAX_LISTED_ESTABLISHMENTS);
  const hidden = establishments.length - listed.length;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {listed.map((est) => (
        <span key={est.id} className="text-xs">
          <span className="font-medium">{est.name}</span>
          <span className="text-muted-foreground">
            {" "}
            — {est.formatted_address}
          </span>
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-xs text-muted-foreground">
          {USERS_PAGE.moreEstablishments(hidden)}
        </span>
      )}
    </div>
  );
}
