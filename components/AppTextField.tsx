"use client";

import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import {
  FieldPath,
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { useState } from "react";

type AppTextFieldProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> = UseControllerProps<T, TName> & {
  label?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function AppTextField<
  T extends FieldValues,
  TName extends FieldPath<T>,
>({
  control,
  name,
  type,
  label,
  onChange: onChangeProp,
  ...props
}: AppTextFieldProps<T, TName>) {
  const [showPassword, setShowPassword] = useState(false);
  const { field, fieldState } = useController({ control, name });
  const isSecure = type === "password";
  const hasError = fieldState.invalid && fieldState.isTouched;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <Input
          {...props}
          {...field}
          onChange={(e) => {
            field.onChange(e);
            onChangeProp?.(e);
          }}
          type={isSecure ? (showPassword ? "text" : "password") : type}
          className={
            hasError ? "border-destructive focus-visible:ring-destructive" : ""
          }
        />
        {isSecure && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hasError && fieldState.error?.message && (
        <p className="text-xs text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  );
}
