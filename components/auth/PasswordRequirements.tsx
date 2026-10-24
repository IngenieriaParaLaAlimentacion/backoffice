import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_COPY } from "@/constants/auth";
import { PASSWORD_REQUIREMENTS } from "@/schemas/password.schema";

export type PasswordRequirementsProps = {
  password?: string;
  className?: string;
};

export default function PasswordRequirements({
  password = "",
  className,
}: PasswordRequirementsProps) {
  return (
    <ul
      className={cn(
        "-mt-1 flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5",
        className,
      )}
      aria-label={PASSWORD_COPY.requirementsAria}
    >
      {PASSWORD_REQUIREMENTS.map((req) => {
        const isMet = req.test(password);
        return (
          <li
            key={req.id}
            data-testid={`req-${req.id}`}
            data-met={isMet}
            className="flex items-center gap-1.5 text-xs transition-colors"
          >
            {isMet ? (
              <Check
                className="size-3.5 shrink-0 text-success"
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="size-3.5 shrink-0 text-muted-foreground/50"
                aria-hidden="true"
              />
            )}
            <span className={isMet ? "text-success" : "text-muted-foreground"}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
