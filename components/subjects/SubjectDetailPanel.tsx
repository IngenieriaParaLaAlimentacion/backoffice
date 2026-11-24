"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import { getSubjectAction } from "@/services/subject.service";
import { SubjectDetail } from "@/types/subject";
import type { EstablishmentLatestMeasurement } from "@/types/establishment";
import MeasurementAssessmentList from "@/components/MeasurementAssessmentList";
import { AlertBadgeList } from "@/components/AlertBadge";
import { Separator } from "@/components/ui/separator";
import {
  ageInMonths,
  argentineToday,
  formatAgeMonths,
  EMPTY_VALUE,
  formatDate,
  formatTimestampDate,
} from "@/lib/format";
import { useRenderClock } from "@/hooks/useRenderClock";
import { SUBJECT_DETAIL_PANEL } from "@/constants/subjects";
import { Loader2, X } from "lucide-react";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errorMessages";

export function DetailField({
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

type SubjectDetailPanelProps = {
  /** `null` closes the panel. */
  subjectId: string | null;
  onClose: () => void;
  scopedMeasurement?: EstablishmentLatestMeasurement | null;
  measurementScopeLabel?: string;
};

export default function SubjectDetailPanel({
  subjectId,
  onClose,
  scopedMeasurement,
  measurementScopeLabel,
}: SubjectDetailPanelProps) {
  const { makeAuthorizedRequest } = useAuth();

  const [result, setResult] = useState<
    | { id: string; detail: SubjectDetail; error?: never }
    | { id: string; error: string; detail?: never }
    | null
  >(null);

  useEffect(() => {
    if (!subjectId) return;
    let current = true;
    getSubjectAction(makeAuthorizedRequest, subjectId)
      .then((detail) => {
        if (current) setResult({ id: subjectId, detail });
      })
      .catch((err: unknown) => {
        if (current) {
          setResult({
            id: subjectId,
            error: getErrorMessage(err, {
              fallback: SUBJECT_DETAIL_PANEL.loadError,
            }),
          });
        }
      });
    return () => {
      current = false;
    };
  }, [makeAuthorizedRequest, subjectId]);

  const selected = result?.id === subjectId ? result : null;
  const detail = selected?.detail;
  const error = selected?.error;
  const isLoading = !!subjectId && !selected;
  const now = useRenderClock(detail);
  const isScoped = scopedMeasurement !== undefined;
  const measurement = isScoped ? scopedMeasurement : detail?.latest_measurement;
  const establishment = isScoped
    ? undefined
    : detail?.latest_measurement?.establishment;
  const badgeLabel = isScoped
    ? measurementScopeLabel
    : SUBJECT_DETAIL_PANEL.globalScopeLabel;

  return (
    <Dialog.Root
      open={!!subjectId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setResult(null);
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={cn("fixed inset-0 z-40", OVERLAY_CLASS)} />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="text-xl font-bold tracking-tight">
                {detail
                  ? `${detail.name} ${detail.last_name}`
                  : SUBJECT_DETAIL_PANEL.title}
              </Dialog.Title>
              {measurement !== undefined && (
                <div className="flex flex-col gap-1">
                  {measurement ? (
                    <MeasurementAssessmentList
                      alerts={measurement.alerts}
                      assessments={measurement.assessments}
                      scopeLabel={badgeLabel}
                    />
                  ) : (
                    <AlertBadgeList alerts={[]} hasMeasurement={false} />
                  )}
                  {badgeLabel && (
                    <span className="text-xs text-muted-foreground">
                      {badgeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={28}
              />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <DetailField
                label={SUBJECT_DETAIL_PANEL.fields.dni}
                value={detail.dni}
              />
              <DetailField
                label={SUBJECT_DETAIL_PANEL.fields.sex}
                value={
                  detail.sex === "male"
                    ? SUBJECT_DETAIL_PANEL.fields.male
                    : SUBJECT_DETAIL_PANEL.fields.female
                }
              />
              <DetailField
                label={SUBJECT_DETAIL_PANEL.fields.birthDate}
                value={formatDate(detail.birth_date)}
              />
              <DetailField
                label={SUBJECT_DETAIL_PANEL.fields.age}
                value={formatAgeMonths(
                  ageInMonths(detail.birth_date, argentineToday(now)),
                )}
              />
              <DetailField
                label={SUBJECT_DETAIL_PANEL.fields.isRural}
                value={
                  detail.is_rural
                    ? SUBJECT_DETAIL_PANEL.fields.yes
                    : SUBJECT_DETAIL_PANEL.fields.no
                }
              />
              <DetailField
                label={SUBJECT_DETAIL_PANEL.fields.isIndigenous}
                value={
                  detail.is_indigenous
                    ? SUBJECT_DETAIL_PANEL.fields.yes
                    : SUBJECT_DETAIL_PANEL.fields.no
                }
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {SUBJECT_DETAIL_PANEL.latestMeasurement.label}
                </span>
                {measurement ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground">
                            {SUBJECT_DETAIL_PANEL.latestMeasurement.date}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatTimestampDate(measurement.measured_at)}
                          </td>
                        </tr>
                        {establishment && (
                          <tr>
                            <td className="px-3 py-2 text-muted-foreground">
                              {
                                SUBJECT_DETAIL_PANEL.latestMeasurement
                                  .establishment
                              }
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="font-medium">
                                {establishment.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {establishment.city}, {establishment.province}
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground">
                            {SUBJECT_DETAIL_PANEL.latestMeasurement.weight}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {measurement.weight_kg} kg
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground">
                            {SUBJECT_DETAIL_PANEL.latestMeasurement.height}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {measurement.height_cm} cm
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-muted-foreground">
                            {SUBJECT_DETAIL_PANEL.latestMeasurement.bmi}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {measurement.bmi}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {EMPTY_VALUE}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
