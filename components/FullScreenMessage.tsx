import Link from "next/link";
import type { Route } from "next";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * The app's terminal-state screen: a centred title/body filling the content
 * area, with either a link back somewhere or a retry action. Used for 404,
 * 403 and "we couldn't load your session".
 */
export default function FullScreenMessage({
  title,
  body,
  actionHref,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  /** Renders a link when set; pair with `actionLabel`. */
  actionHref?: Route;
  actionLabel?: string;
  /** Renders a button instead of a link; pair with `actionLabel`. */
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{body}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className={buttonVariants({ size: "sm" })}>
            {actionLabel}
          </Link>
        )}
        {actionLabel && !actionHref && onAction && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Card>
    </div>
  );
}
