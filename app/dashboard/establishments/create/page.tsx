"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { createEstablishmentAction } from "@/services/establishment.service";
import { withPlaceholderGeoData } from "@/lib/establishmentGeoPlaceholder";
import {
  createEstablishmentSchema,
  CreateEstablishmentInput,
} from "@/schemas/establishment.schema";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  CREATE_ESTABLISHMENT_PAGE,
  ESTABLISHMENT_FORM_FIELDS,
} from "@/constants/establishments";

export default function CreateEstablishmentPage() {
  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateEstablishmentInput>({
    resolver: zodResolver(createEstablishmentSchema),
    defaultValues: {
      name: "",
      formatted_address: "",
      city: "",
      province: "",
    },
  });

  const onSubmit = async (data: CreateEstablishmentInput) => {
    setApiError(null);
    try {
      await createEstablishmentAction(
        makeAuthorizedRequest,
        withPlaceholderGeoData(data),
      );
      router.push("/dashboard/establishments");
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : CREATE_ESTABLISHMENT_PAGE.submitError,
      );
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {CREATE_ESTABLISHMENT_PAGE.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {CREATE_ESTABLISHMENT_PAGE.subtitle}
            </p>
          </div>
          <Link
            href="/dashboard/establishments"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "self-start",
            })}
          >
            <ArrowLeft size={14} />
            {CREATE_ESTABLISHMENT_PAGE.back}
          </Link>
        </div>

        <Separator />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 max-w-md"
        >
          <AppTextField
            control={control}
            name="name"
            label={ESTABLISHMENT_FORM_FIELDS.name.label}
            placeholder={CREATE_ESTABLISHMENT_PAGE.namePlaceholder}
            required
          />
          <AppTextField
            control={control}
            name="formatted_address"
            label={ESTABLISHMENT_FORM_FIELDS.address.label}
            placeholder={ESTABLISHMENT_FORM_FIELDS.address.placeholder}
            required
          />
          <AppTextField
            control={control}
            name="city"
            label={ESTABLISHMENT_FORM_FIELDS.city.label}
            placeholder={ESTABLISHMENT_FORM_FIELDS.city.placeholder}
            required
          />
          <AppTextField
            control={control}
            name="province"
            label={ESTABLISHMENT_FORM_FIELDS.province.label}
            placeholder={ESTABLISHMENT_FORM_FIELDS.province.placeholder}
            required
          />
          {apiError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {apiError}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting && <Loader2 className="animate-spin" size={14} />}
            {CREATE_ESTABLISHMENT_PAGE.submitButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
