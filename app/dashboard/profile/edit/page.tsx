"use client";

import { useCallback, useEffect, useState } from "react";
import { useGoBack } from "@/hooks/useGoBack";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import AppTextAreaField from "@/components/AppTextAreaField";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PROFILE_EDIT_PAGE, PROFILE_FIELDS } from "@/constants/users";
import { getErrorMessage } from "@/lib/errorMessages";
import ProfileField from "../ProfileField";

export default function EditProfilePage() {
  const goBack = useGoBack("/dashboard/profile");
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
    formState: { isSubmitting },
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
      goBack();
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={goBack}
          >
            <ArrowLeft size={14} />
            {PROFILE_EDIT_PAGE.back}
          </Button>
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
                  <ProfileField
                    truncate
                    label={PROFILE_EDIT_PAGE.fields.email}
                    value={readOnlyFields.email}
                  />
                  <ProfileField
                    truncate
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
                label={PROFILE_FIELDS.name.label}
                placeholder={PROFILE_FIELDS.name.placeholder}
                required
              />
              <AppTextField
                control={control}
                name="last_name"
                label={PROFILE_FIELDS.lastName.label}
                placeholder={PROFILE_FIELDS.lastName.placeholder}
                required
              />
              <AppTextField
                control={control}
                name="locality"
                label={PROFILE_FIELDS.locality.label}
                placeholder={PROFILE_FIELDS.locality.placeholder}
              />
              <AppTextField
                control={control}
                name="contact_phone"
                label={PROFILE_FIELDS.contactPhone.label}
                placeholder={PROFILE_FIELDS.contactPhone.placeholder}
              />

              <div className="sm:col-span-2">
                <AppTextAreaField
                  control={control}
                  name="description"
                  label={PROFILE_FIELDS.description.label}
                  placeholder={PROFILE_FIELDS.description.placeholder}
                  rows={4}
                />
              </div>
            </div>

            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={goBack}>
                {PROFILE_EDIT_PAGE.cancel}
              </Button>
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
