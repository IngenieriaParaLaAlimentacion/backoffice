import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    test: (p: string) => p.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una letra mayúscula",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lowercase",
    label: "Al menos una letra minúscula",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (p: string) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "Al menos un caracter especial",
    test: (p: string) => /[^a-zA-Z0-9]/.test(p),
  },
] as const;

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
      aria-label="Requisitos de seguridad de la contraseña"
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
