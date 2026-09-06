"use client";

import { useEffect, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { Dialog } from "@base-ui/react/dialog";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import {
  approveEstablishmentRequestAction,
  rejectEstablishmentRequestAction,
} from "@/services/establishmentRequest.service";
import { ApiError } from "@/lib/apiError";
import {
  EstablishmentApprovalResponse,
  EstablishmentRequestAdminView,
} from "@/types/admin";
import {
  createEstablishmentSchema,
  CreateEstablishmentInput,
} from "@/schemas/establishment.schema";
import { PlaceDetails } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Check, Loader2, X } from "lucide-react";
import {
  ESTABLISHMENT_FORM_FIELDS,
  ESTABLISHMENT_REQUEST_REVIEW_PANEL,
} from "@/constants/establishments";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errorMessages";

type PendingAction = "approve" | "reject" | null;

type EstablishmentRequestReviewPanelProps = {
  request: EstablishmentRequestAdminView | null;
  onClose: () => void;
  onApproved: (result: EstablishmentApprovalResponse) => void;
  onRejected: () => void;
  onStale: () => void;
};

/**
 * Review panel for a single establishment request: pre-filled form,
 * approve/reject with a 2-step confirmation, and an optional rejection
 * reason. Owns its own form/confirmation state; the parent only tracks
 * which request is selected and reacts to approve/reject outcomes.
 */
export default function EstablishmentRequestReviewPanel({
  request,
  onClose,
  onApproved,
  onRejected,
  onStale,
}: EstablishmentRequestReviewPanelProps) {
  const { makeAuthorizedRequest } = useAuth();

  const [panelError, setPanelError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // First click arms the action (shows its confirmation UI); a second click
  // on the same button actually submits it. Clicking the other button while
  // one is armed re-arms that one instead, so switching also needs its own
  // confirmation.
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<CreateEstablishmentInput>({
    resolver: zodResolver(createEstablishmentSchema),
    mode: "onChange",
    defaultValues: { name: "", formatted_address: "", city: "", province: "" },
  });

  const { fieldState: addressFieldState } = useController({
    control,
    name: "formatted_address",
  });

  useEffect(() => {
    if (!request) return;
    setPanelError(null);
    setRejectReason("");
    setPendingAction(null);
    setSelectedPlace(null);
    reset({
      name: request.name,
      formatted_address: "",
      city: request.city ?? "",
      province: request.province ?? "",
    });
  }, [request, reset]);

  const onApprove = async (data: CreateEstablishmentInput) => {
    if (!request || !selectedPlace) return;
    setPanelError(null);
    try {
      const result = await approveEstablishmentRequestAction(
        makeAuthorizedRequest,
        request.id,
        {
          ...data,
          place_id: selectedPlace.id,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
        },
      );
      onApproved(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === StatusCodes.CONFLICT) {
        onStale();
        return;
      }
      setPanelError(
        getErrorMessage(err, {
          fallback: ESTABLISHMENT_REQUEST_REVIEW_PANEL.approveError,
        }),
      );
    }
  };

  const onReject = async () => {
    if (!request) return;
    setPanelError(null);
    setIsRejecting(true);
    try {
      await rejectEstablishmentRequestAction(
        makeAuthorizedRequest,
        request.id,
        rejectReason.trim() || undefined,
      );
      onRejected();
    } catch (err) {
      if (err instanceof ApiError && err.status === StatusCodes.CONFLICT) {
        onStale();
        return;
      }
      setPanelError(
        getErrorMessage(err, {
          fallback: ESTABLISHMENT_REQUEST_REVIEW_PANEL.rejectError,
        }),
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveClick = () => {
    if (pendingAction !== "approve") {
      setPendingAction("approve");
      return;
    }
    handleSubmit(onApprove)();
  };

  const handleRejectClick = () => {
    if (pendingAction !== "reject") {
      setPendingAction("reject");
      return;
    }
    onReject();
  };

  return (
    <Dialog.Root
      open={!!request}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-xl font-bold tracking-tight">
                {request?.name}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm">
                {request?.requester_name} {request?.requester_last_name} ·{" "}
                {request?.requester_email}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator />

          {panelError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {panelError}
            </div>
          )}

          {request && (
            <div className="flex flex-col gap-4">
              <AppTextField
                control={control}
                name="name"
                label={ESTABLISHMENT_FORM_FIELDS.name.label}
                placeholder={ESTABLISHMENT_REQUEST_REVIEW_PANEL.namePlaceholder}
                required
              />
              {request.formatted_address && (
                <p className="text-xs text-muted-foreground -mb-2">
                  Dirección declarada por el solicitante:{" "}
                  <span className="font-medium text-foreground">
                    {request.formatted_address}
                  </span>
                </p>
              )}
              <AddressAutocomplete
                label="Dirección"
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
                }}
                onInvalidate={() => {
                  setSelectedPlace(null);
                  setValue("formatted_address", "", {
                    shouldValidate: true,
                    shouldTouch: true,
                  });
                }}
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

              <Separator />

              {pendingAction === "reject" && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">
                    {ESTABLISHMENT_REQUEST_REVIEW_PANEL.rejectReasonLabel}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      {ESTABLISHMENT_REQUEST_REVIEW_PANEL.optionalTag}
                    </span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={
                      ESTABLISHMENT_REQUEST_REVIEW_PANEL.rejectReasonPlaceholder
                    }
                    rows={2}
                    maxLength={500}
                    autoFocus
                    disabled={isSubmitting || isRejecting}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  />
                </div>
              )}

              {pendingAction === "approve" && (
                <p className="text-sm text-muted-foreground">
                  {
                    ESTABLISHMENT_REQUEST_REVIEW_PANEL.approveConfirmationMessage
                  }
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={
                    !isValid || !selectedPlace || isSubmitting || isRejecting
                  }
                  onClick={handleApproveClick}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {pendingAction === "approve"
                    ? ESTABLISHMENT_REQUEST_REVIEW_PANEL.approveConfirmLabel
                    : ESTABLISHMENT_REQUEST_REVIEW_PANEL.approveLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                  disabled={isSubmitting || isRejecting}
                  onClick={handleRejectClick}
                >
                  {isRejecting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                  {pendingAction === "reject"
                    ? ESTABLISHMENT_REQUEST_REVIEW_PANEL.rejectConfirmLabel
                    : ESTABLISHMENT_REQUEST_REVIEW_PANEL.rejectLabel}
                </Button>
              </div>

              {pendingAction && (
                <Button
                  type="button"
                  variant="outline"
                  className="hover:bg-input"
                  disabled={isSubmitting || isRejecting}
                  onClick={() => setPendingAction(null)}
                >
                  {ESTABLISHMENT_REQUEST_REVIEW_PANEL.cancelLabel}
                </Button>
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
