"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listUsersAction } from "@/services/admin.service";
import { UserAdminView } from "@/types/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

const ROLE_SECTIONS: { role: string; label: string }[] = [
  { role: "admin", label: "Administradores" },
  { role: "establishment_manager", label: "Encargados de establecimiento" },
  { role: "professional", label: "Profesionales" },
];

function RoleSection({ role, label }: { role: string; label: string }) {
  const { makeAuthorizedRequest } = useAuth();

  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (currentPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listUsersAction(makeAuthorizedRequest, {
          status: "active",
          role,
          page: currentPage,
          page_size: PAGE_SIZE,
        });
        setUsers(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest, role],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{label}</h2>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          No hay usuarios
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Establecimientos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {user.name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.establishments.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {user.establishments.map((est) => (
                            <span key={est.id} className="text-xs">
                              <span className="font-medium">{est.name}</span>
                              <span className="text-muted-foreground"> — {est.address}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground text-sm">Usuarios aceptados</p>
        </div>

        <Separator />

        {ROLE_SECTIONS.map((section) => (
          <RoleSection key={section.role} {...section} />
        ))}
      </Card>
    </div>
  );
}
