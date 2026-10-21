"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { getMeAction, updateMeAction } from "@/services/user.service";
import { ROLE_LABELS, UpdateProfilePayload } from "@/types/user";
import {
  editProfileSchema,
  EditProfileInput,
} from "@/schemas/editProfile.schema";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PROFILE_EDIT_PAGE } from "@/constants/users";
import { getErrorMessage } from "@/lib/errorMessages";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="text-sm text-muted-foreground border border-input rounded-md px-3 py-2 bg-muted/40">
        {value}
      </p>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();
  const { refetch } = useSession();

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
  } = useForm<EditProfileInput>({
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

  const onSubmit = async (data: EditProfileInput) => {
    setApiError(null);
    try {
      const payload: UpdateProfilePayload = {
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        locality: data.locality?.trim() || null,
        contact_phone: data.contact_phone?.trim() || null,
        description: data.description?.trim() || null,
      };
      await updateMeAction(makeAuthorizedRequest, payload);
      refetch();
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
            className="flex flex-col gap-4 max-w-md"
          >
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

            <div className="flex flex-col gap-1">
              <label
                htmlFor="profile-description"
                className="text-sm font-medium text-foreground"
              >
                {PROFILE_EDIT_PAGE.fields.description}
              </label>
              <textarea
                id="profile-description"
                {...register("description")}
                placeholder={PROFILE_EDIT_PAGE.fields.descriptionPlaceholder}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {readOnlyFields && (
              <>
                <ReadOnlyField
                  label={PROFILE_EDIT_PAGE.fields.email}
                  value={readOnlyFields.email}
                />
                <ReadOnlyField
                  label={PROFILE_EDIT_PAGE.fields.role}
                  value={readOnlyFields.role}
                />
              </>
            )}

            {apiError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="self-start"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={14} />}
              {PROFILE_EDIT_PAGE.save}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
