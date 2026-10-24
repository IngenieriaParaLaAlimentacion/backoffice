"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  FieldPath,
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { useId } from "react";

type AppTextAreaFieldProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> = UseControllerProps<T, TName> & {
  label?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

/** `AppTextField` for multi-line text: same label, error and touched rules. */
export default function AppTextAreaField<
  T extends FieldValues,
  TName extends FieldPath<T>,
>({
  control,
  name,
  label,
  onChange: onChangeProp,
  ...props
}: AppTextAreaFieldProps<T, TName>) {
  const inputId = useId();
  const { field, fieldState } = useController({ control, name });
  const hasError = fieldState.invalid && fieldState.isTouched;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <Textarea
        id={inputId}
        {...props}
        {...field}
        value={field.value ?? ""}
        onChange={(e) => {
          field.onChange(e);
          onChangeProp?.(e);
        }}
        aria-invalid={hasError}
      />
      {hasError && fieldState.error?.message && (
        <p className="text-xs text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  );
}
