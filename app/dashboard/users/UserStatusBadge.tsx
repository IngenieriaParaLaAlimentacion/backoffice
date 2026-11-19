import { PILL_CLASS, TONE_PILL_CLASS } from "@/constants/theme";
import { USER_STATUS_TONE } from "@/constants/users";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/types/user";

/** The pill with an account's status, toned by it. */
export default function UserStatusBadge({
  status,
  className,
}: {
  status: string | undefined;
  className?: string;
}) {
  if (!status) return null;

  return (
    <span
      className={cn(
        PILL_CLASS,
        TONE_PILL_CLASS[USER_STATUS_TONE[status] ?? "neutral"],
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
