"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { getMeAction, updateMeAction } from "@/services/user.service";
import { ROLE_LABELS } from "@/types/user";
import {
  editProfileSchema,
  EditProfileInput,
  EditProfileOutput,
} from "@/schemas/editProfile.schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import AppTextField from "@/components/AppTextField";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PROFILE_EDIT_PAGE } from "@/constants/users";
import { getErrorMessage } from "@/lib/errorMessages";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{value}</dd>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [readOnlyFields, setReadOnlyFields] = useState<{
    email: string;
    role: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { isSubmitting, errors },
  } = useForm<EditProfileInput, unknown, EditProfileOutput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: "",
      last_name: "",
      locality: "",
      contact_phone: "",
      description: "",
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getMeAction(makeAuthorizedRequest);
      reset({
        name: profile.name,
        last_name: profile.last_name,
        locality: profile.locality ?? "",
        contact_phone: profile.contact_phone ?? "",
        description: profile.description ?? "",
      });
      setReadOnlyFields({
        email: profile.email,
        role: ROLE_LABELS[profile.role] ?? profile.role,
      });
    } catch (err) {
      setApiError(
        getErrorMessage(err, { fallback: PROFILE_EDIT_PAGE.loadError }),
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, [makeAuthorizedRequest, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (data: EditProfileOutput) => {
    setApiError(null);
    try {
      await updateMeAction(makeAuthorizedRequest, data);
      router.push("/dashboard/profile");
    } catch (err) {
      setApiError(
        getErrorMessage(err, { fallback: PROFILE_EDIT_PAGE.saveError }),
      );
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">
              {PROFILE_EDIT_PAGE.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {PROFILE_EDIT_PAGE.subtitle}
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "self-start",
            })}
          >
            <ArrowLeft size={14} />
            {PROFILE_EDIT_PAGE.back}
          </Link>
        </div>

        <Separator />

        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex max-w-2xl flex-col gap-6"
          >
            {readOnlyFields && (
              <section className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadOnlyField
                    label={PROFILE_EDIT_PAGE.fields.email}
                    value={readOnlyFields.email}
                  />
                  <ReadOnlyField
                    label={PROFILE_EDIT_PAGE.fields.role}
                    value={readOnlyFields.role}
                  />
                </dl>
                <p className="text-xs text-muted-foreground">
                  {PROFILE_EDIT_PAGE.readOnlyHint}
                </p>
              </section>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppTextField
                control={control}
                name="name"
                label={PROFILE_EDIT_PAGE.fields.name}
                placeholder={PROFILE_EDIT_PAGE.fields.namePlaceholder}
                required
              />
              <AppTextField
                control={control}
                name="last_name"
                label={PROFILE_EDIT_PAGE.fields.lastName}
                placeholder={PROFILE_EDIT_PAGE.fields.lastNamePlaceholder}
                required
              />
              <AppTextField
                control={control}
                name="locality"
                label={PROFILE_EDIT_PAGE.fields.locality}
                placeholder={PROFILE_EDIT_PAGE.fields.localityPlaceholder}
              />
              <AppTextField
                control={control}
                name="contact_phone"
                label={PROFILE_EDIT_PAGE.fields.contactPhone}
                placeholder={PROFILE_EDIT_PAGE.fields.contactPhonePlaceholder}
              />

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label
                  htmlFor="profile-description"
                  className="text-sm font-medium text-foreground"
                >
                  {PROFILE_EDIT_PAGE.fields.description}
                </label>
                <Textarea
                  id="profile-description"
                  {...register("description")}
                  placeholder={PROFILE_EDIT_PAGE.fields.descriptionPlaceholder}
                  rows={4}
                  aria-invalid={Boolean(errors.description)}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/profile"
                className={buttonVariants({ variant: "outline" })}
              >
                {PROFILE_EDIT_PAGE.cancel}
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                {PROFILE_EDIT_PAGE.save}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
