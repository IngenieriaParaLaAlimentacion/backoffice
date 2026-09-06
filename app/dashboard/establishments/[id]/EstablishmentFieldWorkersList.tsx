"use client";

import { useEstablishmentFieldWorkers } from "@/hooks/useEstablishmentFieldWorkers";
import { useRevokeAccess } from "@/hooks/useRevokeAccess";
import { useSession } from "@/context/SessionContext";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import Pagination from "@/components/Pagination";
import RevokeAccessMenu from "@/components/listings/RevokeAccessMenu";
import {
  ESTABLISHMENT_DASHBOARD_PAGE as COPY,
  RELATION_STATUS_LABELS,
  RELATION_STATUS_OPTIONS,
  RELATION_STATUS_TONE,
  USER_STATUS_LABELS,
} from "@/constants/establishments";
import { PILL_CLASS, TONE_PILL_CLASS } from "@/constants/theme";
import { EMPTY_VALUE, formatTimestampDate } from "@/lib/format";
import { Loader2, Search } from "lucide-react";

/**
 * Enrollment-based, not activity-based: an approved user with no measurements
 * still shows up (with 0 / "—"), and someone who measured here but is enrolled
 * elsewhere does not.
 *
 * `user_status` (account) and `relation_status` (enrollment here) are
 * independent, so both are shown — this screen is for admins.
 */
export default function EstablishmentFieldWorkersList({
  establishmentId,
}: {
  establishmentId: string;
}) {
  const {
    fieldWorkers,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    relationStatus,
    toggleRelationStatus,
    refetch,
  } = useEstablishmentFieldWorkers(establishmentId);

  const columns = COPY.fieldWorkerColumns;
  const canRevokeAccess = useSession().can("users.revokeAccess");

  const { revokingId, actionError, revoke } = useRevokeAccess(
    {
      confirmDialog: COPY.removeAccessConfirmDialog,
      conflict: COPY.removeAccessConflict,
      genericError: COPY.removeAccessError,
    },
    refetch,
  );

  const handleRemoveAccess = (workerId: string) =>
    revoke(workerId, workerId, establishmentId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{COPY.fieldWorkersTitle}</h2>
        <p className="text-muted-foreground text-sm">
          {COPY.fieldWorkersSubtitle}
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
              placeholder={COPY.fieldWorkersSearchPlaceholder}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            {COPY.relationStatus}
          </label>
          <MultiSelect
            options={RELATION_STATUS_OPTIONS}
            selected={relationStatus}
            onToggle={toggleRelationStatus}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : fieldWorkers.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          {COPY.noFieldWorkers}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">{columns.name}</th>
                  <th className="px-4 py-3 font-medium">{columns.email}</th>
                  <th className="px-4 py-3 font-medium">
                    {columns.userStatus}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {columns.relationStatus}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {columns.measurements}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {columns.lastMeasuredAt}
                  </th>
                  <th className="w-12 px-4 py-3 font-medium">
                    <span className="sr-only">{COPY.actionsMenuLabel}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fieldWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="bg-card transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">
                      {worker.name} {worker.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {worker.email}
                    </td>
                    <td className="px-4 py-3">
                      {USER_STATUS_LABELS[worker.user_status] ??
                        worker.user_status}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`${PILL_CLASS} ${TONE_PILL_CLASS[RELATION_STATUS_TONE[worker.relation_status]]}`}
                      >
                        {RELATION_STATUS_LABELS[worker.relation_status] ??
                          worker.relation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{worker.measurement_count}</td>
                    <td className="px-4 py-3">
                      {worker.last_measured_at ? (
                        formatTimestampDate(worker.last_measured_at)
                      ) : (
                        <span className="text-muted-foreground">
                          {EMPTY_VALUE}
                        </span>
                      )}
                    </td>
                    <td className="w-12 px-4 py-3">
                      {worker.relation_status === "approved" &&
                        canRevokeAccess && (
                          <RevokeAccessMenu
                            label={COPY.removeAccess}
                            menuLabel={COPY.actionsMenuLabel}
                            isSubmitting={revokingId === worker.id}
                            onRevoke={() => handleRemoveAccess(worker.id)}
                          />
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {fieldWorkers.map((worker) => (
              <div
                key={worker.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {worker.name} {worker.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {worker.email}
                    </span>
                  </div>
                  {worker.relation_status === "approved" && canRevokeAccess && (
                    <RevokeAccessMenu
                      label={COPY.removeAccess}
                      menuLabel={COPY.actionsMenuLabel}
                      isSubmitting={revokingId === worker.id}
                      onRevoke={() => handleRemoveAccess(worker.id)}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`${PILL_CLASS} ${TONE_PILL_CLASS[RELATION_STATUS_TONE[worker.relation_status]]}`}
                  >
                    {RELATION_STATUS_LABELS[worker.relation_status] ??
                      worker.relation_status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {USER_STATUS_LABELS[worker.user_status] ??
                      worker.user_status}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {worker.measurement_count} mediciones ·{" "}
                  {worker.last_measured_at
                    ? formatTimestampDate(worker.last_measured_at)
                    : EMPTY_VALUE}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
