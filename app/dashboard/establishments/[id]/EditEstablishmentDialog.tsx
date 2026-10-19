"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppTextField from "@/components/AppTextField";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useUpdateEstablishment } from "@/hooks/useUpdateEstablishment";
import {
  EditEstablishmentInput,
  editEstablishmentSchema,
} from "@/schemas/establishment.schema";
import {
  EDIT_ESTABLISHMENT_DIALOG as COPY,
  ESTABLISHMENT_FORM_FIELDS as FIELDS,
} from "@/constants/establishments";
import { OVERLAY_CLASS } from "@/constants/theme";
import { PlaceDetails } from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  EstablishmentResponse,
  UpdateEstablishmentRequest,
} from "@/types/establishment";

const toInput = (e: EstablishmentResponse): EditEstablishmentInput => ({
  name: e.name,
  city: e.city,
  province: e.province,
});

/**
 * Only what changed goes in the PATCH. The address goes whole or not at all:
 * a picked place sends its text, `place_id` and coordinates together.
 */
function changes(
  current: EstablishmentResponse,
  values: EditEstablishmentInput,
  place: PlaceDetails | null,
): UpdateEstablishmentRequest {
  const body: UpdateEstablishmentRequest = {};
  if (values.name !== current.name) body.name = values.name;
  if (values.city !== current.city) body.city = values.city;
  if (values.province !== current.province) body.province = values.province;
  if (place && place.id !== current.place_id)
    Object.assign(body, {
      formatted_address: place.formattedAddress,
      place_id: place.id,
      latitude: place.lat,
      longitude: place.lng,
    });
  return body;
}

/**
 * Name and address (the establishment's "datos generales"), admin-only. The
 * current address is shown as text and only swapped for the autocomplete on
 * request: the autocomplete can't be pre-filled with a place, and most edits
 * don't touch the address at all.
 */
export default function EditEstablishmentDialog({
  establishment,
  onSaved,
}: {
  establishment: EstablishmentResponse;
  onSaved: (updated: EstablishmentResponse) => void;
}) {
  const [open, setOpen] = useState(false);
  const [changingAddress, setChangingAddress] = useState(false);
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [noChanges, setNoChanges] = useState(false);
  const { save, isSaving, error, reset } = useUpdateEstablishment(
    establishment.id,
  );
  const {
    control,
    handleSubmit,
    setValue,
    reset: resetForm,
  } = useForm<EditEstablishmentInput>({
    resolver: zodResolver(editEstablishmentSchema),
    defaultValues: toInput(establishment),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetForm(toInput(establishment));
      setChangingAddress(false);
      setPlace(null);
      setNoChanges(false);
      reset();
    }
  }

  const onSubmit = async (values: EditEstablishmentInput) => {
    const body = changes(establishment, values, place);
    // The backend 422s an empty PATCH; nothing to send is not an error.
    if (Object.keys(body).length === 0) {
      setNoChanges(true);
      return;
    }
    setNoChanges(false);
    const updated = await save(body);
    if (!updated) return;
    setOpen(false);
    onSaved(updated);
  };

  // A new address may sit in another city: prefill city and province when the
  // provider resolves them, and either way ask to check them before saving.
  const selectPlace = (picked: PlaceDetails) => {
    setPlace(picked);
    if (picked.city) setValue("city", picked.city, { shouldValidate: true });
    if (picked.province)
      setValue("province", picked.province, { shouldValidate: true });
  };

  const addressPending = changingAddress && !place;
  const localityHint = place
    ? place.city || place.province
      ? COPY.localityPrefilled
      : COPY.checkLocality
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        render={<Button size="sm" variant="outline" className="shrink-0" />}
      >
        <Pencil size={14} />
        {COPY.button}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn("fixed inset-0 z-[60]", OVERLAY_CLASS)}
        />
        {/* No overflow scroll on the popup: the address suggestions are an
            absolutely positioned list that a scroll container would clip. */}
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold">
                {COPY.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {COPY.description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<button type="button" aria-label={COPY.cancel} />}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <fieldset
              disabled={isSaving}
              className="flex min-w-0 flex-col gap-4"
            >
              <AppTextField
                control={control}
                name="name"
                label={FIELDS.name.label}
                required
              />

              {changingAddress ? (
                <div className="flex flex-col gap-1.5">
                  <AddressAutocomplete
                    label={COPY.newAddress}
                    required
                    error={addressPending ? COPY.pickAddress : undefined}
                    onSelect={selectPlace}
                    onInvalidate={() => setPlace(null)}
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="self-start px-0"
                    onClick={() => {
                      setChangingAddress(false);
                      setPlace(null);
                    }}
                  >
                    {COPY.keepAddress}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {COPY.currentAddress}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {establishment.formatted_address}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="self-start px-0"
                    onClick={() => setChangingAddress(true)}
                  >
                    {COPY.changeAddress}
                  </Button>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <AppTextField
                  control={control}
                  name="city"
                  label={FIELDS.city.label}
                  required
                />
                <AppTextField
                  control={control}
                  name="province"
                  label={FIELDS.province.label}
                  required
                />
                {localityHint && (
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    {localityHint}
                  </p>
                )}
              </div>
            </fieldset>

            {(error || noChanges) && (
              <Alert variant={error ? "destructive" : "default"}>
                <AlertDescription>{error ?? COPY.noChanges}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Dialog.Close render={<Button type="button" variant="ghost" />}>
                {COPY.cancel}
              </Dialog.Close>
              <Button type="submit" disabled={isSaving || addressPending}>
                {isSaving ? COPY.saving : COPY.save}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
