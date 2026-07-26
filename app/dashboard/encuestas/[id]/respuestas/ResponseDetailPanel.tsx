"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSurveyResponseDashboardDetailAction } from "@/services/survey.service";
import { SurveyResponseDetail } from "@/types/survey";
import { Separator } from "@/components/ui/separator";
import { RESPONSE_TYPE_LABELS, RESPUESTAS_PAGE } from "@/constants/surveys";

type ResponseDetailPanelProps = {
  responseId: string | null;
  onClose: () => void;
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function DetailField({
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

export default function ResponseDetailPanel({
  responseId,
  onClose,
}: ResponseDetailPanelProps) {
  const { makeAuthorizedRequest } = useAuth();
  const [detail, setDetail] = useState<SurveyResponseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const data = await getSurveyResponseDashboardDetailAction(
          makeAuthorizedRequest,
          id,
        );
        setDetail(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar el detalle de la respuesta",
        );
      } finally {
        setLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    if (responseId) {
      fetchDetail(responseId);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [responseId, fetchDetail]);

  function renderAnswerValue(
    value: string | number | string[] | null,
    valueLabel: string | string[] | null,
  ): React.ReactNode {
    if (valueLabel) {
      if (Array.isArray(valueLabel)) {
        return (
          <div className="flex flex-wrap gap-1">
            {valueLabel.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        );
      }
      return <span className="text-sm">{valueLabel}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {v}
            </span>
          ))}
        </div>
      );
    }
    if (value === null || value === undefined) {
      <span className="text-muted-foreground">—</span>;
    }
    return <span className="text-sm">{String(value)}</span>;
  }

  return (
    <Dialog.Root
      open={!!responseId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <Dialog.Title className="text-xl font-bold tracking-tight">
              {detail
                ? `${detail.submitted_by.name} — ${detail.establishment.name}`
                : RESPUESTAS_PAGE.detailTitle}
            </Dialog.Title>
            <Dialog.Close
              render={<button type="button" />}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator />

          {loading ? (
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label={RESPUESTAS_PAGE.respondent}
                  value={detail.submitted_by.name}
                />
                <DetailField
                  label={RESPUESTAS_PAGE.establishment}
                  value={detail.establishment.name}
                />
                <DetailField
                  label="Ciudad"
                  value={
                    detail.establishment.city || (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
                <DetailField
                  label="Provincia"
                  value={
                    detail.establishment.province || (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
                <DetailField
                  label={RESPUESTAS_PAGE.date}
                  value={formatDateTime(detail.event_at)}
                />
                <DetailField
                  label={RESPUESTAS_PAGE.score}
                  value={
                    detail.score_fies !== null ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {detail.score_fies}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">
                  {RESPUESTAS_PAGE.questionAnswers}
                </span>
                {detail.answers.map((answer) => (
                  <div
                    key={answer.question_id}
                    className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {RESPONSE_TYPE_LABELS[answer.response_type]}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {answer.question_text}
                    </span>
                    <div className="mt-1">
                      {renderAnswerValue(answer.value, answer.value_label) ?? (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
