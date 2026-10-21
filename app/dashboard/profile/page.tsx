"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMeAction } from "@/services/user.service";
import { ProfileResponse, ROLE_LABELS } from "@/types/user";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, SquarePen } from "lucide-react";
import { PROFILE_PAGE } from "@/constants/users";
import { getErrorMessage } from "@/lib/errorMessages";

import MyEstablishmentsSection from "./MyEstablishmentsSection";

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
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
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 max-w-md">
              <ProfileField
                label={PROFILE_PAGE.fields.name}
                value={profile.name}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.lastName}
                value={profile.last_name}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.email}
                value={profile.email}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.role}
                value={ROLE_LABELS[profile.role] ?? profile.role}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.accountStatus}
                value={PROFILE_PAGE.active}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.locality}
                value={profile.locality || "-"}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.contactPhone}
                value={profile.contact_phone || "-"}
              />
              <ProfileField
                label={PROFILE_PAGE.fields.description}
                value={profile.description || "-"}
              />
            </div>

            <Separator />

            <MyEstablishmentsSection
              initialEstablishments={profile.establishments ?? undefined}
              onUpdate={fetchProfile}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
