"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useAuth } from "@/context/AuthContext";
import { getSubjectAction } from "@/services/subject.service";
import { SubjectDetail } from "@/types/subject";
import { MeasurementAlert } from "@/types/measurement";
import { AlertBadgeList } from "@/components/AlertBadge";
import { Separator } from "@/components/ui/separator";
import { EMPTY_VALUE, formatDate, formatDateTime } from "@/lib/format";
import { Loader2, X } from "lucide-react";

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
  /**
   * Alerts of a scoped latest measurement, e.g. the one at a given comedor.
   * When omitted the panel falls back to the subject's global latest
   * measurement from `GET /subjects/{id}`.
   */
  alerts?: MeasurementAlert[];
  /** `false` renders "Sin datos" instead of a green "Normal" pill. */
  hasMeasurement?: boolean;
  /** Scope of `alerts`, e.g. "Último relevamiento en este comedor". */
  alertScopeLabel?: string;
};

const GLOBAL_SCOPE_LABEL = "Último relevamiento (todos los comedores)";

export default function SubjectDetailPanel({
  subjectId,
  onClose,
  alerts,
  hasMeasurement,
  alertScopeLabel,
}: SubjectDetailPanelProps) {
  const { makeAuthorizedRequest } = useAuth();

  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (id: string) => {
      setDetail(null);
      setError(null);
      setIsLoading(true);
      try {
        const data = await getSubjectAction(makeAuthorizedRequest, id);
        setDetail(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el sujeto",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    if (!subjectId) return;
    fetchDetail(subjectId);
  }, [subjectId, fetchDetail]);

  // A scoped caller (the comedor view) wins. Otherwise fall back to the
  // subject's global latest measurement — but only if the API actually carries
  // the field: an absent key means an older contract (render no badge), while
  // an explicit `null` means the subject has never been measured, which is
  // "Sin datos" and never the green "Normal" pill.
  const isScoped = alerts !== undefined;
  const hasGlobalField = !!detail && "latest_measurement" in detail;

  const showBadge = isScoped || hasGlobalField;
  const badgeAlerts = isScoped
    ? alerts
    : (detail?.latest_measurement?.alerts ?? []);
  const badgeHasMeasurement = isScoped
    ? hasMeasurement
    : !!detail?.latest_measurement;
  const badgeLabel = isScoped ? alertScopeLabel : GLOBAL_SCOPE_LABEL;

  return (
    <Dialog.Root
      open={!!subjectId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="text-xl font-bold tracking-tight">
                {detail ? `${detail.name} ${detail.last_name}` : "Sujeto"}
              </Dialog.Title>
              {showBadge && (
                <div className="flex flex-col gap-1">
                  <AlertBadgeList
                    alerts={badgeAlerts ?? []}
                    hasMeasurement={badgeHasMeasurement}
                    scopeLabel={badgeLabel}
                  />
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
              <DetailField label="Documento de identidad" value={detail.dni} />
              <DetailField
                label="Sexo"
                value={detail.sex === "male" ? "Masculino" : "Femenino"}
              />
              <DetailField
                label="Fecha de nacimiento"
                value={formatDate(detail.birth_date)}
              />
              <DetailField
                label="Población rural"
                value={detail.is_rural ? "Sí" : "No"}
              />
              <DetailField
                label="Población indígena"
                value={detail.is_indigenous ? "Sí" : "No"}
              />
              <DetailField
                label="Fecha de último relevamiento"
                value={
                  detail.latest_measurement ? (
                    formatDateTime(detail.latest_measurement.measured_at)
                  ) : (
                    <span className="text-muted-foreground">{EMPTY_VALUE}</span>
                  )
                }
              />
              {detail.latest_measurement && (
                <DetailField
                  label="Última medición"
                  value={`${detail.latest_measurement.weight_kg} kg · ${detail.latest_measurement.height_cm} cm · IMC ${detail.latest_measurement.bmi}`}
                />
              )}
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
