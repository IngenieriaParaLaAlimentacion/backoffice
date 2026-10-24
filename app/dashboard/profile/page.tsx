"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMeAction } from "@/services/user.service";
import { ProfileResponse, ROLE_LABELS } from "@/types/user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, SquarePen } from "lucide-react";
import { PROFILE_FIELDS, PROFILE_PAGE } from "@/constants/users";
import { PILL_CLASS, TONE_PILL_CLASS } from "@/constants/theme";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";

import MyEstablishmentsSection from "./MyEstablishmentsSection";
import ProfileField from "./ProfileField";

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-4 md:p-5">
      <h2 className="text-lg">{title}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

export default function ProfilePage() {
  const { makeAuthorizedRequest } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMeAction(makeAuthorizedRequest);
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err, { fallback: PROFILE_PAGE.loadError }));
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{PROFILE_PAGE.title}</h1>
            <p className="text-muted-foreground text-sm">
              {PROFILE_PAGE.subtitle}
            </p>
          </div>
          <Link
            href="/dashboard/profile/edit"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "self-start",
            })}
          >
            <SquarePen size={14} />
            {PROFILE_PAGE.editProfile}
          </Link>
        </div>

        <Separator />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <ProfileSection title={PROFILE_PAGE.sections.personal}>
                <ProfileField
                  label={PROFILE_FIELDS.name.label}
                  value={profile.name}
                />
                <ProfileField
                  label={PROFILE_FIELDS.lastName.label}
                  value={profile.last_name}
                />
                <ProfileField
                  label={PROFILE_FIELDS.locality.label}
                  value={profile.locality}
                />
                <ProfileField
                  label={PROFILE_FIELDS.contactPhone.label}
                  value={profile.contact_phone}
                />
                <ProfileField
                  label={PROFILE_FIELDS.description.label}
                  value={profile.description}
                  className="sm:col-span-2"
                />
              </ProfileSection>

              <ProfileSection title={PROFILE_PAGE.sections.account}>
                <ProfileField
                  label={PROFILE_PAGE.fields.email}
                  value={profile.email}
                  className="sm:col-span-2"
                />
                <ProfileField
                  label={PROFILE_PAGE.fields.role}
                  value={ROLE_LABELS[profile.role] ?? profile.role}
                />
                <ProfileField
                  label={PROFILE_PAGE.fields.accountStatus}
                  value={
                    <span className={cn(PILL_CLASS, TONE_PILL_CLASS.success)}>
                      {PROFILE_PAGE.active}
                    </span>
                  }
                />
              </ProfileSection>
            </div>

            <MyEstablishmentsSection />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
