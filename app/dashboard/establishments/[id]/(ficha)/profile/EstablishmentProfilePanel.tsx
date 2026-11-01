"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import CharacterizationFields from "@/components/establishments/CharacterizationFields";
import CharacterizationView from "@/components/establishments/CharacterizationView";
import { useSession } from "@/context/SessionContext";
import { useSaveEstablishmentCharacterization } from "@/hooks/useSaveEstablishmentCharacterization";
import {
  ESTABLISHMENT_PROFILE as COPY,
  PROFILE_EDIT_PARAM,
} from "@/constants/establishments";
import {
  CharacterizationInput,
  characterizationSchema,
  toCharacterizationInput,
  toCharacterizationRequest,
} from "@/schemas/establishmentCharacterization.schema";
import {
  CharacterizationStatus,
  EstablishmentCharacterization,
  EstablishmentCharacterizationResponse,
} from "@/types/establishment";

function ProfileForm({
  establishmentId,
  initial,
  onSaved,
  onCancel,
}: {
  establishmentId: string;
  initial: EstablishmentCharacterization;
  onSaved: (result: EstablishmentCharacterizationResponse) => void;
  onCancel: () => void;
}) {
  const { control, handleSubmit, setError } = useForm<CharacterizationInput>({
    resolver: zodResolver(characterizationSchema),
    defaultValues: toCharacterizationInput(initial),
  });
  const { save, isSaving, error, errorField } =
    useSaveEstablishmentCharacterization(establishmentId, onSaved);

  // A 422 that names its field is pinned on that field, next to the input,
  // and the values typed so far stay in place.
  useEffect(() => {
    if (errorField && errorField in initial)
      setError(errorField as keyof CharacterizationInput, {
        message: COPY.invalidField,
      });
  }, [errorField, initial, setError]);

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        save(toCharacterizationRequest(values)),
      )}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-muted-foreground">{COPY.formHint}</p>

      <CharacterizationFields control={control} disabled={isSaving} />

      {error && !errorField && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          {COPY.cancel}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? COPY.saving : COPY.save}
        </Button>
      </div>
    </form>
  );
}

/**
 * The Perfil tab. Edit mode lives in the URL (`?edit=1`) rather than in local
 * state, so the "Perfil pendiente" badge can link straight into the form —
 * including from this same tab, where only the query string changes.
 */
export default function EstablishmentProfilePanel({
  establishmentId,
  characterization,
  status,
  onSaved,
}: {
  establishmentId: string;
  characterization: EstablishmentCharacterization;
  status: CharacterizationStatus;
  onSaved: (result: EstablishmentCharacterizationResponse) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useSession();
  const canEdit = can("establishments.characterization.edit");
  const isEditing = canEdit && searchParams.get(PROFILE_EDIT_PARAM) === "1";

  // `replace`, like the tab links: entering or leaving the form must not add
  // a step to "Volver".
  const setEditing = (editing: boolean) =>
    router.replace(editing ? `${pathname}?${PROFILE_EDIT_PARAM}=1` : pathname, {
      scroll: false,
    });

  if (isEditing)
    return (
      <ProfileForm
        establishmentId={establishmentId}
        initial={characterization}
        onSaved={(result) => {
          onSaved(result);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );

  if (status === "pending")
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
        <ClipboardList className="text-muted-foreground" size={28} />
        <span className="font-medium">{COPY.emptyTitle}</span>
        <span className="max-w-md text-sm text-muted-foreground">
          {canEdit ? COPY.emptyBodyEditor : COPY.emptyBodyReader}
        </span>
        {canEdit && (
          <Button onClick={() => setEditing(true)}>
            {COPY.completeAction}
          </Button>
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="self-end"
          onClick={() => setEditing(true)}
        >
          <Pencil size={14} />
          {COPY.edit}
        </Button>
      )}
      <CharacterizationView characterization={characterization} />
    </div>
  );
}
