"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppTextField from "@/components/AppTextField";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import {
  acceptInviteSchema,
  AcceptInviteInput,
  AcceptInviteOutput,
} from "@/schemas/acceptInvite.schema";
import { acceptInviteAction } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/errorMessages";
import { ACCEPT_INVITE_FORM } from "@/constants/auth";

const COPY = ACCEPT_INVITE_FORM;

type AcceptInviteFormProps = {
  token: string;
  roleLabel: string;
};

export default function AcceptInviteForm({
  token,
  roleLabel,
}: AcceptInviteFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const descriptionId = useId();

  const {
    formState: { isSubmitting, isValid, errors },
    control,
    register,
    handleSubmit,
  } = useForm<AcceptInviteInput, unknown, AcceptInviteOutput>({
    resolver: zodResolver(acceptInviteSchema),
    mode: "all",
    defaultValues: {
      name: "",
      last_name: "",
      password: "",
      confirmPassword: "",
      locality: "",
      contact_phone: "",
      description: "",
    },
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const descriptionField = register("description");

  async function handleAcceptInvite(data: AcceptInviteOutput) {
    setFormError(null);
    try {
      await acceptInviteAction({
        token,
        new_password: data.password,
        name: data.name,
        last_name: data.last_name,
        locality: data.locality,
        contact_phone: data.contact_phone,
        description: data.description,
      });
      setIsSuccess(true);
    } catch (err) {
      const message = getErrorMessage(err, {
        overrides: COPY.errors,
        fallback: COPY.submitError,
      });
      setFormError(message);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">{COPY.success.title}</h1>
          <p className="text-sm text-muted-foreground">{COPY.success.body}</p>
        </div>
        <Link
          href="/signin"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          {COPY.success.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div data-auth-wide className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-semibold">{COPY.title(roleLabel)}</h1>
        <p className="text-sm text-muted-foreground">{COPY.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit(handleAcceptInvite)}
        className="flex flex-col gap-6"
      >
        {/* Desktop: required fields on the left, optional contact on the right. */}
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-x-8">
          <div className="flex flex-col gap-6">
            <FormSection title={COPY.sections.personal}>
              <div className="grid grid-cols-2 gap-3">
                <AppTextField
                  name="name"
                  control={control}
                  label={COPY.fields.name.label}
                  required
                  placeholder={COPY.fields.name.placeholder}
                  onChange={() => setFormError(null)}
                />
                <AppTextField
                  name="last_name"
                  control={control}
                  label={COPY.fields.lastName.label}
                  required
                  placeholder={COPY.fields.lastName.placeholder}
                  onChange={() => setFormError(null)}
                />
              </div>
            </FormSection>

            <FormSection title={COPY.sections.password}>
              <AppTextField
                name="password"
                control={control}
                label={COPY.fields.password.label}
                required
                placeholder={COPY.fields.password.placeholder}
                type="password"
                onChange={() => setFormError(null)}
              />
              {/* Opens on the first keystroke so the empty form stays short. */}
              {password && (
                <PasswordRequirements
                  password={password}
                  className="animate-in fade-in slide-in-from-top-1 duration-200"
                />
              )}
              <AppTextField
                name="confirmPassword"
                control={control}
                label={COPY.fields.confirmPassword.label}
                required
                placeholder={COPY.fields.confirmPassword.placeholder}
                type="password"
                onChange={() => setFormError(null)}
              />
            </FormSection>
          </div>

          <FormSection
            title={COPY.sections.contact}
            hint={COPY.sections.optional}
          >
            <AppTextField
              name="locality"
              control={control}
              label={COPY.fields.locality.label}
              placeholder={COPY.fields.locality.placeholder}
              onChange={() => setFormError(null)}
            />
            <AppTextField
              name="contact_phone"
              control={control}
              label={COPY.fields.contactPhone.label}
              placeholder={COPY.fields.contactPhone.placeholder}
              onChange={() => setFormError(null)}
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor={descriptionId}
                className="text-sm font-medium text-foreground"
              >
                {COPY.fields.description.label}
              </label>
              <Textarea
                id={descriptionId}
                {...descriptionField}
                placeholder={COPY.fields.description.placeholder}
                rows={3}
                className="md:min-h-36"
                aria-invalid={Boolean(errors.description)}
                onChange={(e) => {
                  descriptionField.onChange(e);
                  setFormError(null);
                }}
              />
              {errors.description?.message && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </FormSection>
        </div>

        <div className="flex flex-col gap-3">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? COPY.submitting : COPY.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex w-full items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
        {hint && (
          <span className="font-normal tracking-normal normal-case">
            ({hint})
          </span>
        )}
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </h2>
      {children}
    </section>
  );
}
