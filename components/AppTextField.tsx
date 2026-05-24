"use client";

import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
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
> = UseControllerProps<T, TName> & TextFieldProps;

export default function AppTextField<
  T extends FieldValues,
  TName extends FieldPath<T>,
>({ control, name, type, ...props }: AppTextFieldProps<T, TName>) {
  const [showPassword, setShowPassword] = useState(false);
  const { field, fieldState } = useController({ control, name });
  const isSecure = type === "password";

  const TogglePassword = isSecure && (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword((prev) => !prev)}
        onMouseDown={(e) => e.preventDefault()}
        onMouseUp={(e) => e.preventDefault()}
        edge="end"
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <TextField
      {...props}
      {...field}
      onChange={(e) => {
        field.onChange(e);
        props.onChange?.(e);
      }}
      size={"small"}
      error={fieldState.invalid && fieldState.isTouched}
      helperText={fieldState.error?.message}
      type={isSecure ? (!showPassword ? "password" : "text") : type}
      slotProps={{
        input: {
          endAdornment: TogglePassword,
        },
      }}
    />
  );
}
