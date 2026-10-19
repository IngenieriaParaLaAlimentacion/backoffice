"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Resolver, useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { invalidateEstablishmentsMap } from "@/hooks/useEstablishmentsMap";
import { createEstablishmentAction } from "@/services/establishment.service";
import { createEstablishmentRequestAction } from "@/services/establishmentRequest.service";
import { PlaceDetails } from "@/lib/geo";
import {
  createEstablishmentRequestSchema,
  CreateEstablishmentRequestInput,
  createEstablishmentSchema,
} from "@/schemas/establishment.schema";
import {
  CharacterizationInput,
  characterizationSchema,
  EMPTY_CHARACTERIZATION,
  isCharacterizationEmpty,
  toCharacterizationInput,
  toCharacterizationRequest,
} from "@/schemas/establishmentCharacterization.schema";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import CharacterizationFields from "@/components/establishments/CharacterizationFields";
import {
  CREATE_ESTABLISHMENT_PAGE,
  ESTABLISHMENT_FORM_FIELDS as FIELDS,
  ESTABLISHMENT_PROFILE,
  PROPOSE_ESTABLISHMENT_PAGE,
} from "@/constants/establishments";
import { getErrorMessage } from "@/lib/errorMessages";

const LIST_HREF = "/dashboard/establishments";
// The list page reads this flag once to show a transient success banner,
// then strips it from the URL — see the `proposed` handling in (list)/page.tsx.
const LIST_HREF_AFTER_PROPOSE = `${LIST_HREF}?proposed=1`;

/**
 * - `create` (admin): the address is picked in the autocomplete (place +
 *   coordinates), city and province are required, the establishment exists
 *   on submit.
 * - `propose` (analyst): a request for an admin to review. The address is
 *   free text — a request carries no `place_id`; the admin picks the real
 *   place when approving — and city/province are optional.
 */
export type EstablishmentFormMode = "create" | "propose";

const COPY = {
  create: CREATE_ESTABLISHMENT_PAGE,
  propose: PROPOSE_ESTABLISHMENT_PAGE,
} as const;

/** Both schemas share one shape; only city/province are optional in one. */
const RESOLVER = {
  create: zodResolver(
    createEstablishmentSchema,
  ) as Resolver<CreateEstablishmentRequestInput>,
  propose: zodResolver(createEstablishmentRequestSchema),
};

export default function EstablishmentForm({
  mode,
}: {
  mode: EstablishmentFormMode;
}) {
  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const copy = COPY[mode];
  const isCreate = mode === "create";

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateEstablishmentRequestInput>({
    resolver: RESOLVER[mode],
    defaultValues: { name: "", formatted_address: "", city: "", province: "" },
  });

  // The profile is its own form so it reuses the Perfil tab's fields and
  // schema as they are. Left untouched, it sends nothing ("Contestar luego").
  const profileForm = useForm<CharacterizationInput>({
    resolver: zodResolver(characterizationSchema),
    defaultValues: toCharacterizationInput(EMPTY_CHARACTERIZATION),
  });

  const { fieldState: addressFieldState } = useController({
    control,
    name: "formatted_address",
  });

  const onSubmit = async (data: CreateEstablishmentRequestInput) => {
    if (isCreate && !selectedPlace) return;
    // A profile error would sit inside the collapsed section: open it so the
    // message is visible instead of the submit silently doing nothing.
    if (!(await profileForm.trigger())) {
      setProfileOpen(true);
      return;
    }
    const profile = toCharacterizationRequest(profileForm.getValues());
    const characterization = isCharacterizationEmpty(profile)
      ? undefined
      : profile;

    setApiError(null);
    try {
      if (isCreate) {
        await createEstablishmentAction(makeAuthorizedRequest, {
          name: data.name,
          formatted_address: data.formatted_address,
          city: data.city ?? "",
          province: data.province ?? "",
          place_id: selectedPlace!.id,
          latitude: selectedPlace!.lat,
          longitude: selectedPlace!.lng,
          characterization,
        });
        invalidateEstablishmentsMap();
        router.push(LIST_HREF);
      } else {
        await createEstablishmentRequestAction(makeAuthorizedRequest, {
          ...data,
          characterization,
        });
        router.push(LIST_HREF_AFTER_PROPOSE);
      }
    } catch (err) {
      setApiError(getErrorMessage(err, { fallback: copy.submitError }));
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="min-w-0 flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{copy.title}</h1>
            <p className="text-muted-foreground text-sm">{copy.subtitle}</p>
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
            {copy.back}
          </Link>
        </div>

        <Separator />

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-w-3xl flex-col gap-4"
        >
          <div className="flex max-w-md flex-col gap-4">
            <AppTextField
              control={control}
              name="name"
              label={FIELDS.name.label}
              placeholder={copy.namePlaceholder}
              required
            />
            {isCreate ? (
              <AddressAutocomplete
                label={FIELDS.address.label}
                required
                error={
                  addressFieldState.isTouched
                    ? addressFieldState.error?.message
                    : undefined
                }
                onSelect={(place) => {
                  setSelectedPlace(place);
                  setValue("formatted_address", place.formattedAddress, {
                    shouldValidate: true,
                    shouldTouch: true,
                  });
                  if (place.city)
                    setValue("city", place.city, { shouldValidate: true });
                  if (place.province)
                    setValue("province", place.province, {
                      shouldValidate: true,
                    });
                }}
                onInvalidate={() => {
                  setSelectedPlace(null);
                  setValue("formatted_address", "", {
                    shouldValidate: true,
                    shouldTouch: true,
                  });
                }}
              />
            ) : (
              <AppTextField
                control={control}
                name="formatted_address"
                label={FIELDS.address.label}
                placeholder={FIELDS.address.placeholder}
                required
              />
            )}
            <AppTextField
              control={control}
              name="city"
              label={FIELDS.city.label}
              placeholder={FIELDS.city.placeholder}
              required={isCreate}
            />
            <AppTextField
              control={control}
              name="province"
              label={FIELDS.province.label}
              placeholder={FIELDS.province.placeholder}
              required={isCreate}
            />
          </div>

          <details
            open={profileOpen}
            onToggle={(e) => setProfileOpen(e.currentTarget.open)}
            className="rounded-lg border border-border"
          >
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              {ESTABLISHMENT_PROFILE.optionalSection}
            </summary>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <p className="text-sm text-muted-foreground">
                {ESTABLISHMENT_PROFILE.formHint}
              </p>
              <CharacterizationFields
                control={profileForm.control}
                disabled={isSubmitting}
              />
            </div>
          </details>

          {apiError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {apiError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || (isCreate && !selectedPlace)}
            className="self-start"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={14} />}
            {copy.submitButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
