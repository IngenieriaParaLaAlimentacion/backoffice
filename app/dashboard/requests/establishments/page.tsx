"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listPendingEstablishmentAccessAction } from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import {
  CARD_HOVER_CLASS,
  ROW_HOVER_CLASS,
  rowStateClass,
} from "@/components/listings/RowAffordance";
import EstablishmentAccessReviewPanel from "./EstablishmentAccessReviewPanel";
import { useRefreshRequestCounts } from "../layout";
import { CircleCheck, ClipboardCheck, Loader2, Search, X } from "lucide-react";
import { ESTABLISHMENT_ACCESS_REQUESTS_PAGE } from "@/constants/users";

const PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function EstablishmentAccessRequestsContent() {
  const { makeAuthorizedRequest } = useAuth();
  const refreshCounts = useRefreshRequestCounts();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live in the query string so they survive a refresh or a back
  // navigation from the review panel, same pattern as Establecimientos.
  const search = searchParams.get("search") ?? "";
  const page = parsePage(searchParams.get("page"));

  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local mirror so typing stays responsive; the debounce writes to the URL.
  const [searchInput, setSearchInput] = useState(search);

  const [selectedUser, setSelectedUser] = useState<UserAdminView | null>(null);

  const updateParams = useCallback(
    (next: Partial<{ search: string; page: number }>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.search !== undefined) {
        if (next.search) params.set("search", next.search);
        else params.delete("search");
      }
      if (next.page !== undefined) {
        if (next.page > 1) params.set("page", String(next.page));
        else params.delete("page");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (searchInput === search) return;
    const timeout = setTimeout(() => {
      updateParams({ search: searchInput, page: 1 });
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput, search, updateParams]);

  const fetchPendingAccess = useCallback(
    async (currentPage: number, currentSearch: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listPendingEstablishmentAccessAction(
          makeAuthorizedRequest,
          {
            page: currentPage,
            page_size: PAGE_SIZE,
            search: currentSearch || undefined,
          },
        );
        setUsers(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : ESTABLISHMENT_ACCESS_REQUESTS_PAGE.loadError,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    fetchPendingAccess(page, search);
  }, [fetchPendingAccess, page, search]);

  const handleApplied = (userId: string, remainingCount: number) => {
    if (remainingCount === 0) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      // Some establishments are still pending: refetch so the row shows the
      // updated list instead of the stale one.
      fetchPendingAccess(page, search);
    }
    refreshCounts();
    setSuccessMessage(ESTABLISHMENT_ACCESS_REQUESTS_PAGE.successMessage);
    setSelectedUser(null);
  };

  const openReview = (user: UserAdminView) => {
    setSelectedUser(user);
    setSuccessMessage(null);
  };

  return (
    <>
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">
            {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.subtitle}
          </p>
        </div>

        <Separator />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label className="text-xs text-muted-foreground">
              {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.searchLabel}
            </label>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={16}
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  ESTABLISHMENT_ACCESS_REQUESTS_PAGE.searchPlaceholder
                }
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-600 text-sm">
            <CircleCheck size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="shrink-0 text-emerald-600/70 hover:text-emerald-600"
              aria-label={ESTABLISHMENT_ACCESS_REQUESTS_PAGE.closeAria}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.noRequests}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.columns.name}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.columns.email}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {
                        ESTABLISHMENT_ACCESS_REQUESTS_PAGE.columns
                          .pendingEstablishments
                      }
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.columns.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <tr
                        key={user.id}
                        onClick={() => openReview(user)}
                        className={`${ROW_HOVER_CLASS} ${rowStateClass(isSelected)}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {user.name} {user.last_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.establishments.length}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => openReview(user)}
                            >
                              <ClipboardCheck size={14} />
                              {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.reviewButton}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {users.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => openReview(user)}
                    className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${CARD_HOVER_CLASS} ${rowStateClass(isSelected)}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {user.name} {user.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.pendingEstablishmentsCount(
                          user.establishments.length,
                        )}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => openReview(user)}
                    >
                      <ClipboardCheck size={14} />
                      {ESTABLISHMENT_ACCESS_REQUESTS_PAGE.reviewButton}
                    </Button>
                  </div>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(next) => updateParams({ page: next })}
            />
          </>
        )}
      </Card>

      <EstablishmentAccessReviewPanel
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onApplied={handleApplied}
      />
    </>
  );
}

export default function EstablishmentAccessRequestsPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      }
    >
      <EstablishmentAccessRequestsContent />
    </Suspense>
  );
}
