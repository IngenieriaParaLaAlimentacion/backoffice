import { Check, Circle } from "lucide-react";

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
  className = "",
}: PasswordRequirementsProps) {
  return (
    <ul
      className={`flex flex-col gap-1 py-1 ${className}`.trim()}
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
                className="size-3.5 text-success shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Circle
                className="size-3.5 text-muted-foreground/60 shrink-0"
                aria-hidden="true"
              />
            )}
            <span
              className={
                isMet ? "text-success font-medium" : "text-muted-foreground"
              }
            >
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
