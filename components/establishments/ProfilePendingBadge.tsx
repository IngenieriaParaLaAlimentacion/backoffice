import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, ClipboardList } from "lucide-react";
import { PILL_CLASS, TONE_PILL_CLASS } from "@/constants/theme";
import { ESTABLISHMENT_PROFILE as COPY } from "@/constants/establishments";
import { cn } from "@/lib/utils";

const BADGE_CLASS = cn(
  PILL_CLASS,
  TONE_PILL_CLASS.warning,
  "inline-flex items-center gap-1",
);

/**
 * "Perfil pendiente", shown under an establishment's name in the ficha and
 * the listing. With `href` (only for whoever can edit the profile) it links
 * straight to the profile form; without it, it's a plain label.
 */
export default function ProfilePendingBadge<T extends string>({
  href,
  onClick,
}: {
  href?: Route<T>;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  if (!href)
    return (
      <span className={BADGE_CLASS}>
        <ClipboardList size={12} />
        {COPY.pendingBadge}
      </span>
    );

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(BADGE_CLASS, "hover:underline")}
    >
      <ClipboardList size={12} />
      {COPY.pendingBadge}
      <span className="sr-only">: {COPY.completeAction}</span>
      <ArrowRight size={12} />
    </Link>
  );
}
