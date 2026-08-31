"use client";

import { useState } from "react";
import { useEstablishmentSubjects } from "@/hooks/useEstablishmentSubjects";
import { EstablishmentSubjectSortOrder } from "@/types/establishment";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/Pagination";
import SubjectDetailPanel from "@/components/subjects/SubjectDetailPanel";
import {
  AlertBadgeList,
  SEVERITY_ROW_CLASS,
  topSeverity,
} from "@/components/AlertBadge";
import {
  ESTABLISHMENT_DASHBOARD_PAGE as COPY,
  SELECT_CLASS,
  SUBJECT_SORT_OPTIONS,
} from "@/constants/establishments";
import { formatAgeMonths, formatDateTime } from "@/lib/format";
import {
  CARD_HOVER_CLASS,
  ChevronCell,
  ChevronHeaderCell,
  RowChevron,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import { Loader2, Search } from "lucide-react";

export default function EstablishmentSubjectsList({
  establishmentId,
}: {
  establishmentId: string;
}) {
  const {
    subjects,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
  } = useEstablishmentSubjects(establishmentId);

  // The row's `id` is the SUBJECT id — `latest_measurement.id` is a different
  // id and is not what the detail panel navigates with.
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const selected = subjects.find((s) => s.id === selectedSubjectId);

  const columns = COPY.subjectColumns;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{COPY.subjectsTitle}</h2>
        <p className="text-muted-foreground text-sm">
          {COPY.subjectsSubtitle(total)}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">{COPY.search}</label>
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={COPY.subjectsSearchPlaceholder}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">{COPY.sortBy}</label>
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as EstablishmentSubjectSortOrder)
            }
            className={`${SELECT_CLASS} w-full sm:w-56`}
          >
            {SUBJECT_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          {COPY.noSubjects}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">{columns.name}</th>
                  <th className="px-4 py-3 font-medium">{columns.dni}</th>
                  <th className="px-4 py-3 font-medium">{columns.age}</th>
                  <th className="px-4 py-3 font-medium">
                    {columns.measuredAt}
                  </th>
                  <th className="px-4 py-3 font-medium">{columns.weight}</th>
                  <th className="px-4 py-3 font-medium">{columns.height}</th>
                  <th className="px-4 py-3 font-medium">{columns.bmi}</th>
                  <th className="px-4 py-3 font-medium">{columns.status}</th>
                  <ChevronHeaderCell />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((subject) => {
                  const severity = topSeverity(
                    subject.latest_measurement.alerts,
                  );
                  const isSelected = selectedSubjectId === subject.id;
                  return (
                    <tr
                      key={subject.id}
                      onClick={() => setSelectedSubjectId(subject.id)}
                      className={`${ROW_HOVER_CLASS} ${rowStateClass(isSelected, severity ? SEVERITY_ROW_CLASS[severity] : undefined)}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {subject.name} {subject.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {subject.dni}
                      </td>
                      <td className="px-4 py-3">
                        {formatAgeMonths(subject.age_months)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDateTime(subject.latest_measurement.measured_at)}
                        {subject.measurement_count > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({subject.measurement_count})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {subject.latest_measurement.weight_kg} kg
                      </td>
                      <td className="px-4 py-3">
                        {subject.latest_measurement.height_cm} cm
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {subject.latest_measurement.bmi}
                      </td>
                      <td className="px-4 py-3">
                        <AlertBadgeList
                          alerts={subject.latest_measurement.alerts}
                          scopeLabel={COPY.subjectScopeLabel}
                        />
                      </td>
                      <ChevronCell />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {subjects.map((subject) => {
              const severity = topSeverity(subject.latest_measurement.alerts);
              const isSelected = selectedSubjectId === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`flex flex-col gap-2 rounded-lg border border-border p-3 text-left ${CARD_HOVER_CLASS} ${rowStateClass(isSelected, severity ? SEVERITY_ROW_CLASS[severity] : undefined)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {subject.name} {subject.last_name}
                      <span className="text-muted-foreground">
                        {" "}
                        ({subject.dni})
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(subject.latest_measurement.measured_at)}
                      <RowChevron />
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{formatAgeMonths(subject.age_months)}</span>
                    <span>
                      <span className="font-medium text-foreground">
                        {subject.latest_measurement.weight_kg}
                      </span>{" "}
                      kg
                    </span>
                    <span>
                      <span className="font-medium text-foreground">
                        {subject.latest_measurement.height_cm}
                      </span>{" "}
                      cm
                    </span>
                    <span>
                      IMC{" "}
                      <span className="font-medium text-foreground">
                        {subject.latest_measurement.bmi}
                      </span>
                    </span>
                  </div>

                  <div className="w-fit">
                    <AlertBadgeList
                      alerts={subject.latest_measurement.alerts}
                      scopeLabel={COPY.subjectScopeLabel}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <SubjectDetailPanel
        subjectId={selectedSubjectId}
        onClose={() => setSelectedSubjectId(null)}
        alerts={selected?.latest_measurement.alerts}
        hasMeasurement
        alertScopeLabel={COPY.subjectScopeLabel}
      />
    </div>
  );
}
