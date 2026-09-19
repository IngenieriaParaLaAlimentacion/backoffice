"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { createEstablishmentRequestAction } from "@/services/establishmentRequest.service";
import {
  createEstablishmentRequestSchema,
  CreateEstablishmentRequestInput,
} from "@/schemas/establishment.schema";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  ESTABLISHMENT_FORM_FIELDS,
  PROPOSE_ESTABLISHMENT_PAGE,
} from "@/constants/establishments";
import { getErrorMessage } from "@/lib/errorMessages";

const LIST_HREF = "/dashboard/establishments";
// The list page reads this flag once to show a transient success banner,
// then strips it from the URL — see the `proposed` handling in (list)/page.tsx.
const LIST_HREF_AFTER_PROPOSE = `${LIST_HREF}?proposed=1`;

export default function ProposeEstablishmentPage() {
  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateEstablishmentRequestInput>({
    resolver: zodResolver(createEstablishmentRequestSchema),
    defaultValues: { name: "", formatted_address: "", city: "", province: "" },
  });

  const onSubmit = async (data: CreateEstablishmentRequestInput) => {
    setApiError(null);
    try {
      await createEstablishmentRequestAction(makeAuthorizedRequest, data);
      router.push(LIST_HREF_AFTER_PROPOSE);
    } catch (err) {
      setApiError(
        getErrorMessage(err, {
          fallback: PROPOSE_ESTABLISHMENT_PAGE.submitError,
        }),
      );
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">
              {PROPOSE_ESTABLISHMENT_PAGE.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {PROPOSE_ESTABLISHMENT_PAGE.subtitle}
            </p>
          </div>
          <Link
            href={LIST_HREF}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "self-start",
            })}
          >
            <ArrowLeft size={14} />
            {PROPOSE_ESTABLISHMENT_PAGE.back}
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
            placeholder={PROPOSE_ESTABLISHMENT_PAGE.namePlaceholder}
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
          />
          <AppTextField
            control={control}
            name="province"
            label={ESTABLISHMENT_FORM_FIELDS.province.label}
            placeholder={ESTABLISHMENT_FORM_FIELDS.province.placeholder}
          />
          {apiError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {apiError}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting && <Loader2 className="animate-spin" size={14} />}
            {PROPOSE_ESTABLISHMENT_PAGE.submitButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
