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
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: "", last_name: "" },
  });

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getMeAction(makeAuthorizedRequest);
      reset({ name: profile.name, last_name: profile.last_name });
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
