import { PILL_CLASS, TONE_PILL_CLASS } from "@/constants/theme";
import { USER_STATUS_LABELS, USER_STATUS_TONE } from "@/constants/users";
import { cn } from "@/lib/utils";
import { UserStatus } from "@/types/establishment";

/** The pill with an account's status, toned by it. */
export default function UserStatusBadge({
  status,
  className,
}: {
  status: UserStatus | undefined;
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
      {USER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
